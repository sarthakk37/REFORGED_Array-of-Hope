"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-10-18 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Runs table
    op.create_table(
        "runs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("scenario", sa.String(length=32), nullable=False),
        sa.Column("service_name", sa.String(length=128), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("external_ref", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("healed_from_memory", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("llm_calls", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("iterations", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Run Events table
    op.create_table(
        "run_events",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("run_id", sa.String(length=64), sa.ForeignKey("runs.id"), nullable=False),
        sa.Column("seq", sa.Integer(), nullable=False),
        sa.Column("agent", sa.String(length=32), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_run_events_run_id", "run_events", ["run_id"])
    op.create_index("ix_run_events_seq", "run_events", ["seq"])

    # Drift Reports table
    op.create_table(
        "drift_reports",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "run_id", sa.String(length=64), sa.ForeignKey("runs.id"), unique=True, nullable=False
        ),
        sa.Column("fingerprint", sa.String(length=128), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("changes_json", sa.Text(), nullable=False),
        sa.Column("risk", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_drift_reports_fingerprint", "drift_reports", ["fingerprint"])

    # Patches table
    op.create_table(
        "patches",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "run_id", sa.String(length=64), sa.ForeignKey("runs.id"), unique=True, nullable=False
        ),
        sa.Column("diff_text", sa.Text(), nullable=False),
        sa.Column("plan_summary", sa.Text(), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("test_results_json", sa.Text(), nullable=False),
        sa.Column("sandbox_log", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Pull Requests table
    op.create_table(
        "pull_requests",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "run_id", sa.String(length=64), sa.ForeignKey("runs.id"), unique=True, nullable=False
        ),
        sa.Column("url", sa.String(length=512), nullable=True),
        sa.Column("branch", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("dry_run", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Learned Patterns table
    op.create_table(
        "learned_patterns",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("fingerprint", sa.String(length=128), unique=True, nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("plan_json", sa.Text(), nullable=False),
        sa.Column("times_used", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("calls_saved", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_learned_patterns_fingerprint", "learned_patterns", ["fingerprint"], unique=True
    )


def downgrade() -> None:
    op.drop_table("learned_patterns")
    op.drop_table("pull_requests")
    op.drop_table("patches")
    op.drop_table("drift_reports")
    op.drop_table("run_events")
    op.drop_table("runs")
    op.drop_table("users")
