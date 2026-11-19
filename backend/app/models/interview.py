from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base

class InterviewSessionReport(Base):
    __tablename__ = "interview_session_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False)
    overall_score = Column(Float, default=0.0)
    score_rating = Column(String, default="PASS")
    duration_minutes = Column(Float, default=0.0)
    
    # Store lists and detailed report info as JSON (fully compatible with dict output)
    report_data = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", back_populates="interviews")

    class Config:
        from_attributes = True
