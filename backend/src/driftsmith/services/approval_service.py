"""Service handling human approval and pull request publication."""

from sqlalchemy.orm import Session

from driftsmith.api.schemas import ApproveResponse, PullRequestInfoSchema
from driftsmith.db.repositories import pull_requests as pr_repo
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.integrations.github_client import github_client


def approve_run(db: Session, run_id: str) -> ApproveResponse:
    """Approve a remediation run and finalize pull request."""
    run = runs_repo.get_run(db, run_id)
    if not run:
        raise ValueError(f"Run {run_id} not found")

    if run.status != "awaiting_approval":
        raise ValueError(
            f"Run {run_id} is in status '{run.status}'; only 'awaiting_approval' runs can be approved"
        )

    pr_model = run.pull_request
    branch = pr_model.branch if pr_model else f"driftsmith/fix-{run_id}"

    # Finalize PR via GitHub client
    pr_info: PullRequestInfoSchema = github_client.publish_pull_request(run_id, branch)

    # Persist updated status
    pr_repo.update_status(
        db,
        run_id,
        status="open",
        url=pr_info.url,
        dry_run=False,
    )
    runs_repo.update_run(db, run_id, status="approved")

    return ApproveResponse(
        status="approved",
        pull_request=pr_info,
    )
