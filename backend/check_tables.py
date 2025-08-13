#!/usr/bin/env python3
"""Check what tables exist in the database."""

from app.db import engine
from sqlalchemy import text

def check_tables():
    """Check what tables exist in the database."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            
            print("📋 Tables in database:")
            for table in sorted(tables):
                print(f"  ✅ {table}")
            
            if not tables:
                print("  ❌ No tables found!")
                
    except Exception as e:
        print(f"❌ Error checking tables: {e}")

if __name__ == "__main__":
    check_tables() 
