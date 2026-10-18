"""SQLAlchemy ORM models representing the persistent state of DriftSmith."""

from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from driftsmith.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class UserModel(Base):
    """Registered user account with role-based access control."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="viewer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class RunModel(Base):
    """Remediation run record tracking an API drift resolution attempt."""

    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scenario: Mapped[str] = mapped_column(String(32), nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    external_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    healed_from_memory: Mapped[bool] = mapped_column(Boolean, default=False)
    llm_calls: Mapped[int] = mapped_column(Integer, default=0)
    iterations: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    events: Mapped[list["RunEventModel"]] = relationship(
        "RunEventModel",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="RunEventModel.seq",
    )
    drift_report: Mapped[Optional["DriftReportModel"]] = relationship(
        "DriftReportModel", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )
    patch: Mapped[Optional["PatchModel"]] = relationship(
        "PatchModel", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )
    pull_request: Mapped[Optional["PullRequestModel"]] = relationship(
        "PullRequestModel", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )


class RunEventModel(Base):
    """Sequence-ordered timeline event emitted during remediation."""

    __tablename__ = "run_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("runs.id"), index=True, nullable=False
    )
    seq: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    agent: Mapped[str] = mapped_column(String(32), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="events")


class DriftReportModel(Base):
    """Synthesized drift report with structural diff details."""

    __tablename__ = "drift_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("runs.id"), unique=True, nullable=False
    )
    fingerprint: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    changes_json: Mapped[str] = mapped_column(Text, nullable=False)
    risk: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="drift_report")


class PatchModel(Base):
    """Verified patch artifact and sandbox test output."""

    __tablename__ = "patches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("runs.id"), unique=True, nullable=False
    )
    diff_text: Mapped[str] = mapped_column(Text, nullable=False)
    plan_summary: Mapped[str] = mapped_column(Text, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    test_results_json: Mapped[str] = mapped_column(Text, nullable=False)
    sandbox_log: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="patch")


class PullRequestModel(Base):
    """Pull request preview or live GitHub PR tracking."""

    __tablename__ = "pull_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("runs.id"), unique=True, nullable=False
    )
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    branch: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    dry_run: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="pull_request")


class LearnedPatternModel(Base):
    """Remembered fix pattern enabling zero-inference remediation."""

    __tablename__ = "learned_patterns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    fingerprint: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    plan_json: Mapped[str] = mapped_column(Text, nullable=False)
    times_used: Mapped[int] = mapped_column(Integer, default=0)
    calls_saved: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
