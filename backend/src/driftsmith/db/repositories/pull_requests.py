"""Repository for Pull Request entity persistence."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from driftsmith.api.schemas import PullRequestInfoSchema
from driftsmith.db.models import PullRequestModel


def save_pull_request(
    db: Session,
    run_id: str,
    branch: str,
    status: str = "dry_run",
    dry_run: bool = True,
    url: str | None = None,
) -> PullRequestModel:
    """Store or update pull request details for a run."""
    stmt = select(PullRequestModel).where(PullRequestModel.run_id == run_id)
    existing = db.scalars(stmt).first()

    if existing:
        existing.branch = branch
        existing.status = status
        existing.dry_run = dry_run
        existing.url = url
        db.commit()
        db.refresh(existing)
        return existing

    pr = PullRequestModel(
        id=f"pr-{uuid.uuid4().hex[:8]}",
        run_id=run_id,
        branch=branch,
        status=status,
        dry_run=dry_run,
        url=url,
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr


def update_status(
    db: Session,
    run_id: str,
    status: str,
    url: str | None = None,
    dry_run: bool | None = None,
) -> PullRequestModel | None:
    """Update publication status of a pull request record."""
    stmt = select(PullRequestModel).where(PullRequestModel.run_id == run_id)
    pr = db.scalars(stmt).first()
    if not pr:
        return None

    pr.status = status
    if url is not None:
        pr.url = url
    if dry_run is not None:
        pr.dry_run = dry_run

    db.commit()
    db.refresh(pr)
    return pr


def to_schema(model: PullRequestModel) -> PullRequestInfoSchema:
    """Convert PullRequestModel to contract PullRequestInfoSchema."""
    return PullRequestInfoSchema(
        url=model.url,
        branch=model.branch,
        status=model.status,  # type: ignore[arg-type]
        dry_run=model.dry_run,
    )
