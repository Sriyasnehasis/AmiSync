"""Persistent state for in-progress mock interview sessions.

The service keeps an in-memory cache for speed, but every mutation is mirrored
here so a session survives a backend restart (Render dyno recycle, deploy, etc.).
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from app.core.db import Base


class InterviewSessionState(Base):
    __tablename__ = "interview_session_states"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    industry = Column(String, nullable=True)
    state_json = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
