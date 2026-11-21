import pytest

from app.services.interview_service import (
    InterviewRole,
    MockInterviewService,
)
from app.services import ai_service


@pytest.mark.asyncio
async def test_fallback_returns_five_bank_questions(monkeypatch, fake_db):
    for flag in ("GEMINI_AVAILABLE", "GROQ_AVAILABLE", "OPENROUTER_AVAILABLE"):
        monkeypatch.setattr(ai_service, flag, False)

    service = MockInterviewService()
    result = await service.start_interview_dynamic(
        1, InterviewRole.JUNIOR_DEVELOPER, fake_db
    )

    assert result["total_questions"] == 5
    session = service.sessions[result["session_id"]]
    assert len(session.questions) == 5
    assert all(q.question_text for q in session.questions)
    assert fake_db.committed >= 1  # session persisted


@pytest.mark.asyncio
async def test_small_role_bank_still_produces_five_questions(monkeypatch, fake_db):
    """Roles whose static bank has < 5 questions must not start a short session."""
    for flag in ("GEMINI_AVAILABLE", "GROQ_AVAILABLE", "OPENROUTER_AVAILABLE"):
        monkeypatch.setattr(ai_service, flag, False)

    service = MockInterviewService()
    result = await service.start_interview_dynamic(
        1, InterviewRole.MARKETING_SPECIALIST, fake_db, industry="FMCG"
    )

    assert result["total_questions"] == 5
    assert len(service.sessions[result["session_id"]].questions) == 5


@pytest.mark.asyncio
async def test_ai_generated_questions_are_used_and_industry_is_in_prompt(
    monkeypatch, fake_db
):
    monkeypatch.setattr(ai_service, "GEMINI_AVAILABLE", True)
    monkeypatch.setattr(ai_service, "GROQ_AVAILABLE", False)
    monkeypatch.setattr(ai_service, "OPENROUTER_AVAILABLE", False)

    captured = {}

    async def fake_call_ai(prompt, expect_json=True):
        captured["prompt"] = prompt
        return {
            "questions": [
                {
                    "question_text": f"AI question {i}",
                    "difficulty": "medium",
                    "category": "behavioral",
                    "expected_keywords": ["stakeholders"],
                }
                for i in range(5)
            ]
        }

    monkeypatch.setattr(ai_service, "_call_ai", fake_call_ai)

    service = MockInterviewService()
    result = await service.start_interview_dynamic(
        1, InterviewRole.MARKETING_SPECIALIST, fake_db, industry="FMCG"
    )

    assert result["industry"] == "FMCG"
    assert "FMCG" in captured["prompt"]
    assert result["first_question"] == "AI question 0"
    session = service.sessions[result["session_id"]]
    assert [q.question_text for q in session.questions] == [
        f"AI question {i}" for i in range(5)
    ]
