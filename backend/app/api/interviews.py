from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db, raw_db
from app.core.security import security_service
from app.services.interview_service import (
    mock_interview_service,
    InterviewRole,
    analyze_delivery_metrics,
)
from pydantic import BaseModel

router = APIRouter(prefix="/interviews", tags=["Live Video Interviews"])

# --- SCHEMAS ---

class StartInterviewRequest(BaseModel):
    role: str  # "senior_dev", "junior_dev", "devops", "data_scientist", "product_manager", "fullstack"
    industry: str = ""  # free-form industry / field, e.g. "Healthcare", "FMCG"
    interview_type: str = "voice"  # "voice" or "text"

class SubmitAnswerRequest(BaseModel):
    question_id: int
    user_answer: str  # From voice transcription
    answer_type: str = "voice"  # "voice" or "text"
    duration_seconds: Optional[int] = None

class RTCOfferRequest(BaseModel):
    offer: dict  # WebRTC offer
    video_enabled: bool = True
    audio_enabled: bool = True

class ScreenShareToggleRequest(BaseModel):
    enabled: bool

# --- ENDPOINTS ---

@router.get("/available-roles")
async def get_available_roles():
    """Get all available interview roles"""
    roles = [
        {"id": "junior_dev", "label": "Junior Developer"},
        {"id": "senior_dev", "label": "Senior Developer"},
        {"id": "fullstack", "label": "Full Stack Engineer"},
        {"id": "devops", "label": "DevOps Engineer"},
        {"id": "data_scientist", "label": "Data Scientist"},
        {"id": "product_manager", "label": "Product Manager"},
        {"id": "sales_executive", "label": "Sales Executive"},
        {"id": "marketing_specialist", "label": "Marketing Specialist"},
        {"id": "customer_support", "label": "Customer Support Specialist"},
        {"id": "hr_specialist", "label": "HR Specialist"},
        {"id": "registered_nurse", "label": "Registered Nurse"},
        {"id": "educator_teacher", "label": "Educator / Teacher"},
        {"id": "accountant", "label": "Accountant"},
    ]
    return {
        "roles": roles,
        "count": len(roles),
        "message": "Available interview roles"
    }

@router.get("/available-industries")
async def get_available_industries():
    """Common industries for the interview setup picker (free-form input is also accepted)."""
    industries = [
        "Technology", "Healthcare", "Finance", "Education", "Retail / FMCG",
        "Manufacturing", "Media & Marketing", "Hospitality", "Logistics",
        "Non-profit", "Government / Public Sector", "Other",
    ]
    return {"industries": industries, "count": len(industries)}


@router.get("/past-sessions")
async def get_past_sessions(
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    """Retrieve user's historical interview logs from PostgreSQL"""
    try:
        from app.models.interview import InterviewSessionReport
        results = db.query(InterviewSessionReport).filter(
            InterviewSessionReport.user_id == current_user_id
        ).order_by(InterviewSessionReport.created_at.desc()).all()
        
        sessions = []
        for doc in results:
            data = dict(doc.report_data)
            data["_id"] = str(doc.id)
            data["id"] = doc.id
            data["session_id"] = doc.session_id
            data["user_id"] = doc.user_id
            data["created_at"] = doc.created_at.isoformat()
            sessions.append(data)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch past sessions: {str(e)}")


@router.post("/start-session")
async def start_interview(
    request: StartInterviewRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Start a LIVE voice interview with AI
    
    Features:
    - Voice-based Q&A (speech-to-text, text-to-speech)
    - Real-time feedback
    - Professional interview flow
    
    Args:
        request: Contains role (e.g., "senior_dev")
        
    Returns:
        Session ID, first question, total questions
    """
    # Map role IDs to InterviewRole enums
    role_mapping = {
        "senior_dev": InterviewRole.SENIOR_DEVELOPER,
        "junior_dev": InterviewRole.JUNIOR_DEVELOPER,
        "devops": InterviewRole.DEVOPS_ENGINEER,
        "data_scientist": InterviewRole.DATA_SCIENTIST,
        "product_manager": InterviewRole.PRODUCT_MANAGER,
        "fullstack": InterviewRole.FULLSTACK_ENGINEER,
        "sales_executive": InterviewRole.SALES_EXECUTIVE,
        "marketing_specialist": InterviewRole.MARKETING_SPECIALIST,
        "customer_support": InterviewRole.CUSTOMER_SUPPORT,
        "hr_specialist": InterviewRole.HR_SPECIALIST,
        "registered_nurse": InterviewRole.REGISTERED_NURSE,
        "educator_teacher": InterviewRole.EDUCATOR_TEACHER,
        "accountant": InterviewRole.ACCOUNTANT,
    }
    
    if request.role not in role_mapping:
        available = list(role_mapping.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Available: {', '.join(available)}"
        )
    
    try:
        # Verify user_id is valid
        if not current_user_id or current_user_id <= 0:
            raise HTTPException(status_code=401, detail="Invalid user authentication")
        
        # Map role and validate
        role = role_mapping[request.role]
        print(f"[INTERVIEW] Starting interview for user {current_user_id}, role: {role}")
        
        # Start interview session
        session_data = await mock_interview_service.start_interview_dynamic(
            current_user_id, role, db, industry=(request.industry or "").strip() or None
        )
        print(f"[INTERVIEW] Session created: {session_data['session_id']}")
        
        return {
            "status": "success",
            "session_id": session_data["session_id"],
            "role": session_data["role"],
            "industry": session_data.get("industry"),
            "total_questions": session_data["total_questions"],
            "current_question": {
                "question_id": "1",
                "question_text": session_data["first_question"],
                "difficulty": "medium",
            },
            "message": "Interview started. Speak your answer clearly."
        }
    except HTTPException:
        raise
    except KeyError as e:
        print(f"[INTERVIEW ERROR] Role mapping error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid role: {request.role}")
    except Exception as e:
        print(f"[INTERVIEW ERROR] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Interview startup failed: {str(e)}")


@router.post("/sessions/{session_id}/respond")
async def respond_to_question(
    session_id: str,
    request: SubmitAnswerRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Submit voice/text answer to interview question
    
    Frontend Flow:
    1. AI speaks question via text-to-speech
    2. User speaks answer via Web Speech API (auto-transcribed)
    3. User clicks submit or auto-submit on silence
    4. This endpoint processes the voice transcript
    5. Real-time feedback returned
    6. Next question loaded
    
    Args:
        session_id: Interview session ID
        request: Contains user_answer (text transcript from voice)
        
    Returns:
        Feedback + next question (or interview complete)
    """
    if not request.user_answer or len(request.user_answer.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="Answer too short. Please provide more details."
        )
    
    try:
        # Debug logging
        print(f"[INTERVIEW DEBUG] Submitting answer for session: {session_id}")
        print(f"[INTERVIEW DEBUG] Available sessions: {list(mock_interview_service.sessions.keys())}")
        
        result = await mock_interview_service.submit_answer(session_id, request.user_answer, db)
        feedback = result.get("feedback") or {}
        raw_score = feedback.get("score_out_of_10", 0) or 0

        # Stable, named per-answer payload. The frontend merges this with the
        # delivery analysis (pacing / clarity / fillers) from /analyze-delivery.
        content_feedback = {
            "content_relevance": round(raw_score * 10),
            "clarity": feedback.get("communication", ""),
            "pacing": None,
            "filler_words": None,
            "strengths": feedback.get("strengths", []),
            "improvements": feedback.get("improvements", []),
            "overall_comment": feedback.get("overall_comment", ""),
        }

        if result.get("interview_complete"):
            # Interview finished - get final report
            report = mock_interview_service.end_interview(session_id, db)
            return {
                "status": "interview_complete",
                "feedback": feedback,
                "content_feedback": content_feedback,
                "report": report,
                "metrics_summary": report.get("metrics_summary"),
                "overall_score": report.get("overall_score", result.get("score_so_far")),
                "score_rating": report.get("score_rating", "PASS"),
                "next_question": None,
                "questions_answered": report.get("questions_answered", 5),
                "message": f"Interview complete! Your score: {report.get('overall_score', result.get('score_so_far', 0))}/10"
            }
        else:
            # More questions remaining
            session = mock_interview_service._load_session(session_id, db)
            questions_answered = session.current_question_index if session else 0
            
            return {
                "status": "answer_recorded",
                "feedback": feedback,
                "content_feedback": content_feedback,
                "score_so_far": result.get("score_so_far"),
                "next_question": result.get("next_question"),
                "questions_answered": questions_answered,
                "questions_remaining": result.get("questions_remaining"),
                "message": "Great answer! Next question coming up..."
            }
    except Exception as e:
        print(f"Error processing answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/sessions/{session_id}/current-question")
async def get_current_question(
    session_id: str,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    """Get the current question in the interview"""
    question = mock_interview_service.get_current_question(session_id, db)
    
    if not question:
        return {
            "status": "interview_complete",
            "current_question": None,
            "message": "All questions answered. Interview complete."
        }
    
    return {
        "status": "question_ready",
        "question_id": question.id,
        "question_text": question.question_text,
        "difficulty": question.difficulty,
        "category": question.category,
        "tts_audio_url": f"/api/v1/interviews/sessions/{session_id}/question-audio",
        "message": "Listen to the question or read the text above"
    }

@router.post("/sessions/{session_id}/submit-answer")
async def submit_interview_answer(
    session_id: str,
    request: SubmitAnswerRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    """Legacy endpoint - use /respond instead"""
    if not request.user_answer or len(request.user_answer.strip()) < 5:
        raise HTTPException(status_code=400, detail="Answer too short")
    
    try:
        result = await mock_interview_service.submit_answer(session_id, request.user_answer, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/sessions/{session_id}/rtc-offer")
async def handle_rtc_offer(
    session_id: str,
    request: RTCOfferRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
):
    """Handle WebRTC connection offer"""
    try:
        result = mock_interview_service.handle_rtc_offer(session_id, request.offer)
        
        return {
            "status": "rtc_connected",
            "session_id": session_id,
            "video_enabled": request.video_enabled,
            "audio_enabled": request.audio_enabled,
            "message": "Video/Audio connection established"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WebRTC error: {str(e)}")

@router.post("/sessions/{session_id}/screen-share")
async def toggle_screen_share(
    session_id: str,
    request: ScreenShareToggleRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
):
    """Toggle screen sharing during interview"""
    try:
        result = mock_interview_service.toggle_screen_share(session_id, request.enabled)
        
        return {
            "status": "screen_share_updated",
            "screen_share_active": result["screen_share_active"],
            "message": result["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screen share error: {str(e)}")

@router.post("/sessions/{session_id}/end-interview")
async def end_interview(
    session_id: str,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    """End interview and generate comprehensive report"""
    try:
        report = mock_interview_service.end_interview(session_id, db)
        
        # Save session report to PostgreSQL
        from datetime import datetime
        from app.models.interview import InterviewSessionReport
        
        db_report = InterviewSessionReport(
            session_id=session_id,
            user_id=current_user_id,
            role=report.get("role", "General Professional"),
            overall_score=float(report.get("overall_score", 0)),
            score_rating=report.get("score_rating", "PASS"),
            duration_minutes=float(report.get("duration_minutes", 0)),
            report_data=report,
            created_at=datetime.utcnow()
        )
        try:
            db.add(db_report)
            db.commit()
            print(f"[DB SUCCESS] Saved session report to PostgreSQL: {session_id}")
        except Exception as db_err:
            db.rollback()
            print(f"[DB ERROR] Failed to save session to PostgreSQL: {db_err}")
        
        return {
            "status": "interview_completed",
            "report": {
                "session_id": report.get("session_id"),  
                "role": report.get("role"),
                "industry": report.get("industry"),
                "duration_minutes": report.get("duration_minutes", 0),
                "overall_score": report.get("overall_score", 0),
                "score_rating": report.get("score_rating", "PASS"),
                "metrics_summary": report.get("metrics_summary"),
                "strengths": report.get("strengths", []),
                "improvements": report.get("improvements", []),
                "detailed_improvements": report.get("detailed_improvements", []),
                "recommendation": report.get("recommendation", "PASS"),
                "next_steps": report.get("next_steps", [])
            },
            "message": f"Interview Complete! Score: {report.get('overall_score', 0)}/10"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending interview: {str(e)}")



# --- Delivery Feedback Endpoint ----------------------------------------------
class DeliveryMetricsRequest(BaseModel):
    transcript: str
    duration_seconds: float
    session_id: Optional[str] = None

@router.post("/analyze-delivery")
async def analyze_delivery(
    request: DeliveryMetricsRequest,
    current_user_id: int = Depends(security_service.get_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Analyzes HOW the user spoke (delivery), not just WHAT they said.
    Computes: WPM, filler word count, clarity score, pacing rating.
    Called from frontend after each voice answer is transcribed.
    """
    result = analyze_delivery_metrics(request.transcript, request.duration_seconds)

    # Persist per-answer delivery metrics so the final report can show
    # averaged, named Clarity / Pacing metrics instead of client guesses.
    if request.session_id:
        mock_interview_service.record_delivery(
            request.session_id,
            {
                "wpm": result["wpm"],
                "word_count": result["word_count"],
                "filler_count": result["filler_count"],
                "pacing_score": result["pacing_score"],
                "clarity_score": result["clarity_score"],
                "delivery_score": result["delivery_score"],
            },
            db,
        )

    return result
