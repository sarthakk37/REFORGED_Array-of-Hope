"""Autonomous self-healing remediation pipeline."""

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from driftsmith.ai.agents.coder import CoderAgent
from driftsmith.ai.agents.critic import CriticAgent, CriticFeedback
from driftsmith.ai.agents.triage import TriageAgent
from driftsmith.api.schemas import PatchInfoSchema
from driftsmith.core.locator import locate_field_usages
from driftsmith.core.patch_plan import PatchPlan
from driftsmith.core.patcher import apply_patch_plan
from driftsmith.core.sentinel import detect_drift
from driftsmith.db.repositories import (
    patches as patches_repo,
)
from driftsmith.db.repositories import (
    patterns as patterns_repo,
)
from driftsmith.db.repositories import (
    pull_requests as pr_repo,
)
from driftsmith.db.repositories import (
    runs as runs_repo,
)
from driftsmith.integrations.github_client import github_client
from driftsmith.integrations.n8n_hooks import fire_n8n_completion_webhook
from driftsmith.integrations.sandbox_runner import run_sandbox_verification
from driftsmith.integrations.slack_client import notify_slack
from driftsmith.services.event_bus import event_bus
from driftsmith.services.target_registry import TargetService, target_registry

logger = logging.getLogger("driftsmith.pipeline")


class RemediationPipeline:
    """Executes the closed-loop self-healing remediation lifecycle."""

    def __init__(self) -> None:
        self.triage_agent = TriageAgent()
        self.coder_agent = CoderAgent()
        self.critic_agent = CriticAgent()

    def run(
        self,
        db: Session,
        run_id: str,
        scenario: str,
        service_name: str,
        provided_payload: dict[str, Any] | None = None,
    ) -> bool:
        """Execute the remediation heal loop against the designated target service."""
        target = target_registry.get_target(service_name)
        old_payload = target_registry.get_baseline_payload(target)
        new_payload = target_registry.get_drifting_payload(target, scenario, provided_payload)

        # 1. Detect drift deterministically via Sentinel
        drift_report = detect_drift(scenario, old_payload, new_payload)
        patches_repo.save_drift_report(db, run_id, drift_report)
        seq = 1

        event_bus.emit(
            db,
            run_id,
            seq,
            "sentinel",
            "action",
            f"Detector identified API change in {service_name} payload.",
            {
                "storyStep": 1,
                "isRetry": False,
                "confidence": drift_report.changes[0].confidence if drift_report.changes else 0.95,
            },
        )
        seq += 1

        # 2. Check Learned Patterns (Memory Hit)
        cached_pattern = patterns_repo.get_by_fingerprint(db, drift_report.fingerprint)
        if cached_pattern:
            return self._heal_from_memory(
                db,
                run_id,
                seq,
                target,
                cached_pattern,
                drift_report,
                scenario,
                service_name,
                old_payload,
                new_payload,
            )

        # 3. Memory Miss -> Proceed with AI Investigation Loop
        return self._heal_with_agents(
            db, run_id, seq, target, drift_report, scenario, service_name, old_payload, new_payload
        )

    def _heal_from_memory(
        self,
        db: Session,
        run_id: str,
        seq: int,
        target: TargetService,
        pattern: Any,
        drift_report: Any,
        scenario: str,
        service_name: str,
        old_payload: dict,
        new_payload: dict,
    ) -> bool:
        """Heal instantly using a remembered fix with zero LLM inference calls."""
        event_bus.emit(
            db,
            run_id,
            seq,
            "memory",
            "success",
            f"Fix DriftSmith remembers: matched pattern {pattern.fingerprint}. Zero AI calls required.",
            {"storyStep": 2, "isRetry": False, "fingerprint": pattern.fingerprint},
        )
        seq += 1

        plan = PatchPlan(**json.loads(pattern.plan_json))
        target_file = target.source_files[0] if target.source_files else "service.py"
        source_code = (target.root_path / target_file).read_text(encoding="utf-8")
        patched_code, diff_text = apply_patch_plan(source_code, plan, target_file)

        sb_result = self._verify_in_sandbox(target, target_file, patched_code, scenario)
        if sb_result.verified:
            patterns_repo.increment_usage(db, pattern.fingerprint, calls_saved=3)
            return self._finalize_success(
                db,
                run_id,
                seq,
                target,
                plan,
                diff_text,
                sb_result,
                healed_from_memory=True,
                llm_calls=0,
                iterations=1,
                confidence=0.99,
                scenario=scenario,
                service_name=service_name,
            )

        return self._finalize_failure(
            db, run_id, seq, "Memory pattern verification failed in sandbox", scenario
        )

    def _heal_with_agents(
        self,
        db: Session,
        run_id: str,
        seq: int,
        target: TargetService,
        drift_report: Any,
        scenario: str,
        service_name: str,
        old_payload: dict,
        new_payload: dict,
    ) -> bool:
        """Execute iterative Triage -> Locator -> Coder -> Sandbox -> Critic loop."""
        # Triage diagnosis
        diagnosis = self.triage_agent.diagnose(scenario, service_name, drift_report)
        llm_calls = 1
        event_bus.emit(
            db,
            run_id,
            seq,
            "triage",
            "thought",
            f"Investigator: {diagnosis.summary}",
            {
                "storyStep": 2,
                "isRetry": False,
                "confidence": diagnosis.confidence,
                "risk": diagnosis.risk,
            },
        )
        seq += 1

        # Locator AST analysis
        target_file = target.source_files[0] if target.source_files else "service.py"
        source_code = (target.root_path / target_file).read_text(encoding="utf-8")
        target_keys = diagnosis.affected_fields or [c.path for c in drift_report.changes]
        sites = locate_field_usages(source_code, target_keys, target_file)

        event_bus.emit(
            db,
            run_id,
            seq,
            "locator",
            "action",
            f"Locator found {len(sites)} affected code site(s) in {target_file}.",
            {"storyStep": 2, "isRetry": False, "siteCount": len(sites)},
        )
        seq += 1

        critic_feedback: CriticFeedback | None = None
        max_iterations = 3

        for iteration in range(1, max_iterations + 1):
            # Coder Agent generates PatchPlan
            plan = self.coder_agent.generate_plan(
                scenario, target_file, drift_report, sites, critic_feedback, iteration
            )
            llm_calls += 1

            event_bus.emit(
                db,
                run_id,
                seq,
                "coder",
                "thought",
                f"Code writer generated fix: {plan.summary}",
                {"storyStep": 3, "isRetry": iteration > 1, "iteration": iteration},
            )
            seq += 1

            # Patcher applies AST transformation
            patched_code, diff_text = apply_patch_plan(source_code, plan, target_file)

            # Sandbox verification
            event_bus.emit(
                db,
                run_id,
                seq,
                "verifier",
                "action",
                f"Testing fix in safe test room sandbox (Attempt {iteration}/{max_iterations})...",
                {"storyStep": 4, "isRetry": iteration > 1},
            )
            seq += 1

            sb_result = self._verify_in_sandbox(target, target_file, patched_code, scenario)

            if sb_result.verified:
                event_bus.emit(
                    db,
                    run_id,
                    seq,
                    "verifier",
                    "success",
                    "Fix tested: Baseline and drifting payloads passed all sandbox contract tests.",
                    {"storyStep": 4, "isRetry": False},
                )
                seq += 1

                # Remember successful pattern
                patterns_repo.save_pattern(db, drift_report.fingerprint, plan.summary, plan)
                event_bus.emit(
                    db,
                    run_id,
                    seq,
                    "memory",
                    "success",
                    f"Saved fix to memory with fingerprint {drift_report.fingerprint}.",
                    {"storyStep": 4, "isRetry": False},
                )
                seq += 1

                return self._finalize_success(
                    db,
                    run_id,
                    seq,
                    target,
                    plan,
                    diff_text,
                    sb_result,
                    healed_from_memory=False,
                    llm_calls=llm_calls,
                    iterations=iteration,
                    confidence=diagnosis.confidence,
                    scenario=scenario,
                    service_name=service_name,
                )

            # Verification failed -> Critic feedback
            event_bus.emit(
                db,
                run_id,
                seq,
                "verifier",
                "warning",
                f"Sandbox verification failed on attempt {iteration}: {sb_result.error_output[:120]}",
                {"storyStep": 4, "isRetry": True},
            )
            seq += 1

            if iteration < max_iterations:
                critic_feedback = self.critic_agent.evaluate_failure(
                    scenario, plan, sb_result.error_output
                )
                llm_calls += 1
                event_bus.emit(
                    db,
                    run_id,
                    seq,
                    "critic",
                    "thought",
                    f"Reviewer guidance: {critic_feedback.diagnosis} {critic_feedback.suggested_fix}",
                    {
                        "storyStep": 3,
                        "isRetry": True,
                        "suggestedFix": critic_feedback.suggested_fix,
                    },
                )
                seq += 1

        return self._finalize_failure(
            db,
            run_id,
            seq,
            f"All {max_iterations} remediation attempts failed sandbox verification",
            scenario,
        )

    def _verify_in_sandbox(
        self, target: TargetService, target_file: str, patched_code: str, scenario: str
    ) -> Any:
        """Run sandbox execution using ephemeral temporary workspace."""
        old_payload_file = target.root_path / "fixtures" / "payloads" / "v1.json"
        new_payload_file = target.root_path / "fixtures" / "payloads" / f"{scenario}.json"
        return run_sandbox_verification(
            target_root=target.root_path,
            patched_files={target_file: patched_code},
            old_payload_file=old_payload_file,
            new_payload_file=new_payload_file,
            test_command=target.test_command,
        )

    def _finalize_success(
        self,
        db: Session,
        run_id: str,
        seq: int,
        target: TargetService,
        plan: PatchPlan,
        diff_text: str,
        sb_result: Any,
        healed_from_memory: bool,
        llm_calls: int,
        iterations: int,
        confidence: float,
        scenario: str,
        service_name: str,
    ) -> bool:
        """Persist patch, prepare pull request, update run status, and notify."""
        patch_info = PatchInfoSchema(
            diff_text=diff_text,
            plan_summary=plan.summary,
            verified=True,
            test_results=sb_result.test_results,
            sandbox_log=sb_result.sandbox_log,
        )
        patches_repo.save_patch(db, run_id, patch_info)

        # Prepare GitHub Pull Request preview
        pr_info = github_client.prepare_pull_request(
            run_id=run_id,
            scenario=scenario,
            service_name=service_name,
            diff_text=diff_text,
            summary=plan.summary,
            confidence=confidence,
            test_evidence=sb_result.sandbox_log,
        )
        pr_repo.save_pull_request(
            db, run_id, branch=pr_info.branch, status="dry_run", dry_run=True, url=pr_info.url
        )

        runs_repo.update_run(
            db,
            run_id,
            status="awaiting_approval",
            confidence=confidence,
            verified=True,
            healed_from_memory=healed_from_memory,
            llm_calls=llm_calls,
            iterations=iterations,
            finished=True,
        )

        event_bus.emit(
            db,
            run_id,
            seq,
            "pr",
            "action",
            f"Pull request preview prepared for human review: {pr_info.branch}",
            {"storyStep": 5, "isRetry": False, "branch": pr_info.branch},
        )
        seq += 1

        event_bus.emit(db, run_id, seq, "system", "info", "run_finished", {"status": "completed"})

        notify_slack(
            f"DriftSmith healed {service_name} ({scenario} drift). Ready for approval: {pr_info.branch}"
        )
        fire_n8n_completion_webhook(
            {"run_id": run_id, "status": "awaiting_approval", "scenario": scenario}
        )
        return True

    def _finalize_failure(
        self, db: Session, run_id: str, seq: int, reason: str, scenario: str
    ) -> bool:
        """Persist failed run state honestly."""
        runs_repo.update_run(db, run_id, status="failed", verified=False, finished=True)
        event_bus.emit(
            db, run_id, seq, "system", "error", f"Remediation failed: {reason}", {"storyStep": 4}
        )
        seq += 1
        event_bus.emit(db, run_id, seq, "system", "info", "run_finished", {"status": "failed"})
        notify_slack(f"DriftSmith remediation failed for run {run_id}: {reason}")
        return False


pipeline = RemediationPipeline()
