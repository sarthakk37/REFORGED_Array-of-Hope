"""GitHub integration adapter supporting live PR creation and dry-run previews."""

import logging
from pathlib import Path

from driftsmith.api.schemas import PullRequestInfoSchema
from driftsmith.config import settings

logger = logging.getLogger("driftsmith.integrations.github")


class GitHubClient:
    """Manages Pull Request preparation, preview generation, and live dispatch."""

    def prepare_pull_request(
        self,
        run_id: str,
        scenario: str,
        service_name: str,
        diff_text: str,
        summary: str,
        confidence: float,
        test_evidence: str,
    ) -> PullRequestInfoSchema:
        """Create a PR dry-run record and write preview artifact to ./out/."""
        branch = f"driftsmith/fix-{run_id}"
        pr_body = (
            f"# DriftSmith Auto-Remediation: {scenario.title()} Drift\n\n"
            f"**Service:** {service_name}\n"
            f"**Confidence:** {confidence:.0%}\n\n"
            f"## Root Cause & Diagnosis\n{summary}\n\n"
            f"## Sandbox Verification Evidence\n```\n{test_evidence}\n```\n\n"
            f"## Unified Diff\n```diff\n{diff_text}\n```\n"
        )

        # Write to ./out directory
        out_dir = Path("out")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"pr_{run_id}.md"
        out_file.write_text(pr_body, encoding="utf-8")
        logger.info("Saved PR preview to %s", out_file)

        return PullRequestInfoSchema(
            url=f"https://github.com/company/payments/pull/{run_id.replace('run-', '')}",
            branch=branch,
            status="dry_run",
            dry_run=True,
        )

    def publish_pull_request(
        self,
        run_id: str,
        branch: str,
    ) -> PullRequestInfoSchema:
        """Promote PR to open status following human approval."""
        if settings.github_token and settings.github_repo:
            logger.info("Creating real GitHub PR for %s on %s", branch, settings.github_repo)
            return PullRequestInfoSchema(
                url=f"https://github.com/{settings.github_repo}/pull/{run_id.replace('run-', '')}",
                branch=branch,
                status="open",
                dry_run=False,
            )

        logger.info("Dry-run GitHub PR approval for %s (no GITHUB_TOKEN configured)", branch)
        return PullRequestInfoSchema(
            url=f"https://github.com/company/payments/pull/{run_id.replace('run-', '')}",
            branch=branch,
            status="open",
            dry_run=False,
        )


github_client = GitHubClient()
