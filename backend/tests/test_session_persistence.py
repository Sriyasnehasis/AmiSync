from datetime import datetime

from app.services.interview_service import (
    InterviewQuestion,
    InterviewRole,
    InterviewSession,
    MockInterviewService,
)


class FakeStateQuery:
    def __init__(self, store):
        self.store = store
        self.session_id = None

    def filter(self, expression):
        self.session_id = getattr(expression.right, "value", None)
        return self

    def first(self):
        return self.store.get(self.session_id)


class FakeStateDB:
    def __init__(self):
        self.store = {}
        self.committed = 0

    def query(self, model):
        return FakeStateQuery(self.store)

    def add(self, obj):
        self.store[obj.session_id] = obj

    def commit(self):
        self.committed += 1

    def rollback(self):
        pass


def build_session():
    return InterviewSession(
        session_id="session-123",
        user_id=1,
        role=InterviewRole.SENIOR_DEVELOPER,
        industry="Technology",
        started_at=datetime.utcnow(),
        questions=[
            InterviewQuestion(
                id="q1",
                question_text="Describe a project you led.",
                role="Senior Developer",
                difficulty="medium",
                category="behavioral",
                expected_keywords=["leadership"],
            )
        ],
    )


def test_session_survives_cache_eviction():
    service = MockInterviewService()
    db = FakeStateDB()
    session = build_session()

    service._save_session(session, db)
    assert "session-123" in db.store
    assert db.store["session-123"].state_json["industry"] == "Technology"

    service.sessions.clear()
    restored = service._load_session("session-123", db)

    assert restored is not None
    assert restored.session_id == "session-123"
    assert restored.questions[0].question_text == "Describe a project you led."
    assert restored.industry == "Technology"


def test_delivery_metrics_are_attached_to_session():
    service = MockInterviewService()
    db = FakeStateDB()
    session = build_session()
    service.sessions[session.session_id] = session
    service._save_session(session, db)

    ok = service.record_delivery(
        "session-123", {"wpm": 130, "clarity_score": 90, "pacing_score": 100}, db
    )

    assert ok
    assert len(session.delivery_metrics) == 1
    assert db.store["session-123"].state_json["delivery_metrics"][0]["wpm"] == 130
