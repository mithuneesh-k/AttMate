import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()


# Supabase PostgreSQL URL
DATABASE_URL = os.getenv("DATABASE_URL")
# Fallback: SQLite (for local development only)
SQLITE_URL = "sqlite:///./attmate.db"

def get_engine():
    if DATABASE_URL:
        try:
            # Try connecting to Supabase PostgreSQL
            engine = create_engine(DATABASE_URL)
            engine.connect()
            print("INFO: Successfully connected to Supabase PostgreSQL.")
            return engine
        except Exception as e:
            print(f"WARNING: Supabase connection failed ({e}). Falling back to SQLite.")
    
    # Fallback to local SQLite file
    return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
