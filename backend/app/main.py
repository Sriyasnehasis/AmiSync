from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import engine, Base
from app.models.job import JobListing
from app.models.user import User
from app.api import jobs, auth, resume, applications, interviews, hr_contacts, users, github, ats, cover_letter
from sqlalchemy import inspect, text

# ──────────────────────────────────────────────────────────────────
# DB startup — wrapped so a cold Supabase / bad connection string
# does NOT crash the entire Render dyno.  The server will still
# start and serve /health so Render knows the port is open.
# ──────────────────────────────────────────────────────────────────
_db_ready = False
try:
    Base.metadata.create_all(bind=engine)
    _db_ready = True
    print("[STARTUP] ✅ Database tables created/verified successfully")
except Exception as db_err:
    print(f"[STARTUP] ⚠️  Could not create/verify DB tables: {db_err}")
    print("[STARTUP] Server will still start — DB may be temporarily unavailable.")

# Reflect schema for diagnostics (non-fatal)
if _db_ready:
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        print(f"[STARTUP] Detected tables: {existing_tables}")
        if "users" in existing_tables:
            cols = inspector.get_columns("users")
            print(f"[STARTUP] Users table has {len(cols)} columns")
    except Exception as e:
        print(f"[STARTUP] Warning: Could not inspect tables: {e}")

app = FastAPI(
    title="AmiSync API",
    description="AmiSync — AI-powered career platform",
    version="1.0.0",
)

# CORS — allow all origins for production demo stability
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers ──────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(jobs.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(resume.router, prefix=API_PREFIX)
app.include_router(applications.router, prefix=API_PREFIX)
app.include_router(interviews.router, prefix=API_PREFIX)
app.include_router(hr_contacts.router, prefix=API_PREFIX)
app.include_router(github.router, prefix=API_PREFIX)
app.include_router(ats.router, prefix=API_PREFIX)
app.include_router(cover_letter.router, prefix=API_PREFIX)


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """Health probe used by Render & frontend wake-up pings."""
    db_status = "ok"
    if _db_ready:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception:
            db_status = "degraded"
    else:
        db_status = "unavailable"
    return {"status": "ok", "db": db_status}


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AmiSync API is running",
        "db_ready": _db_ready,
    }