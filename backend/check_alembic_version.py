#!/usr/bin/env python3
"""Check alembic version in database."""

from sqlalchemy import text

from app.db import engine


def check_alembic_version():
    """Check what alembic version is stored in database."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.fetchone()[0]
            print(f"📋 Alembic version in database: {version}")

    except Exception as e:
        print(f"❌ Error checking alembic version: {e}")


if __name__ == "__main__":
    check_alembic_version()
