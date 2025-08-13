#!/usr/bin/env python3
"""Drop all existing tables to recreate them with new migration."""

from sqlalchemy import text

from app.db import engine


def drop_all_tables():
    """Drop all tables except alembic_version."""
    try:
        print("🗑️  Dropping all existing tables...")

        with engine.connect() as conn:
            # Get all table names
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in result]

            print(f"📋 Found {len(tables)} tables:")
            for table in sorted(tables):
                print(f"  - {table}")

            # Drop all tables except alembic_version
            for table in tables:
                if table != "alembic_version":
                    print(f"🗑️  Dropping table: {table}")
                    # Quote table names to handle reserved words like 'user'
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))

            conn.commit()
            print("✅ All tables dropped successfully!")

            # Verify only alembic_version remains
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            remaining_tables = [row[0] for row in result]
            print(f"\n📋 Remaining tables ({len(remaining_tables)}):")
            for table in remaining_tables:
                print(f"  ✅ {table}")

    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        raise


if __name__ == "__main__":
    drop_all_tables()
