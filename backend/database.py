import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Primary: MySQL
MYSQL_URL = os.getenv("DATABASE_URL", "mysql+mysqlconnector://root:password@localhost/attmate")
# Fallback: SQLite (zero-config)
SQLITE_URL = "sqlite:///./attmate.db"

def get_engine():
    try:
        # Try connecting to MySQL first
        engine = create_engine(MYSQL_URL, connect_args={"connect_timeout": 2})
        engine.connect()
        print("INFO: Successfully connected to MySQL.")
        return engine
    except Exception as e:
        print(f"WARNING: MySQL connection failed ({e}). Falling back to SQLite.")
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
