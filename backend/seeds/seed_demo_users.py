"""Seed script to populate initial demo user accounts in the database."""

import sys
from pathlib import Path

# Add backend/src to path so script can be run standalone
backend_src = str(Path(__file__).resolve().parent.parent / "src")
if backend_src not in sys.path:
    sys.path.insert(0, backend_src)

from driftsmith.auth.passwords import hash_password  # noqa: E402
from driftsmith.config import settings  # noqa: E402
from driftsmith.db.repositories.users import create_user  # noqa: E402
from driftsmith.db.session import SessionLocal, init_db  # noqa: E402

DEMO_USERS = [
    ("usr-admin", "admin@demo.local", "admin"),
    ("usr-approver", "approver@demo.local", "approver"),
    ("usr-viewer", "viewer@demo.local", "viewer"),
]


def seed() -> None:
    """Initialize DB and seed default demo accounts."""
    init_db()
    hashed_pw = hash_password(settings.demo_password)

    with SessionLocal() as db:
        for uid, email, role in DEMO_USERS:
            create_user(
                db=db,
                email=email,
                hashed_password=hashed_pw,
                role=role,  # type: ignore[arg-type]
                user_id=uid,
            )
            print(f"Seeded user: {email} ({role})")

    print(f"Seeding completed successfully. Default password is '{settings.demo_password}'.")


if __name__ == "__main__":
    seed()
