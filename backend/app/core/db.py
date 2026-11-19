from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL (Relational) - For structured User & Job data
# Use NullPool to prevent connection caching issues between app restarts
engine = create_engine(os.getenv("POSTGRES_URL"), poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MongoDB (NoSQL) - For storing raw, messy scraped HTML/JSON (Optional)
mongo_client = None
raw_db = None
mongo_url = os.getenv("MONGO_URL")
if mongo_url:
    try:
        mongo_client = AsyncIOMotorClient(mongo_url)
        raw_db = mongo_client.extract_resume_raw
        print("[DB] MongoDB connection initialized")
    except Exception as e:
        print(f"[DB] Warning: Could not connect to MongoDB: {e}")

# Dependency to get a DB session in your API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()