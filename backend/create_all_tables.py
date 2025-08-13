#!/usr/bin/env python3
"""Create all tables directly using SQLAlchemy."""

from app.db import Base, engine
from app.models import *  # Import all models to register them


def create_all_tables():
    """Create all tables directly."""
    try:
        print("🔨 Creating all tables...")
        Base.metadata.create_all(engine)
        print("✅ All tables created successfully!")

        # Verify tables were created
        from sqlalchemy import text

        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in result]

            print(f"\n📋 Tables in database ({len(tables)} total):")
            for table in sorted(tables):
                print(f"  ✅ {table}")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise


if __name__ == "__main__":
    create_all_tables()
