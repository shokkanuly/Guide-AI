"""
GovGuide AI — Manual Database Seeding Script
Run this script to seed the database with government programs and display stats.

Usage:
    python scripts/seed_programs.py
"""
import asyncio
import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import AsyncSessionLocal
from app.utils.seed_data import seed_programs


async def main():
    print("🌱 Starting manual database seeding...")
    async with AsyncSessionLocal() as db:
        try:
            await seed_programs(db)
            await db.commit()
            print("✨ Seeding completed successfully!")
        except Exception as e:
            await db.rollback()
            print(f"❌ Error seeding database: {e}")
            raise e

if __name__ == "__main__":
    asyncio.run(main())
