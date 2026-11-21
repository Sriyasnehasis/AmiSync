"""Shared test fixtures for the Mock Interview module."""

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

# Make the backend `app` package importable when pytest is run from anywhere.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class FakeQuery:
    def __init__(self, result):
        self.result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.result


class FakeDB:
    """Minimal DB double for service-level tests (no real connection)."""

    def __init__(self, user=None, state=None):
        self.user = user
        self.state = state
        self.committed = 0
        self.added = []

    def query(self, model):
        from app.models.user import User
        from app.models.interview_session_state import InterviewSessionState

        if model is User:
            return FakeQuery(self.user)
        if model is InterviewSessionState:
            return FakeQuery(self.state)
        return FakeQuery(None)

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed += 1

    def rollback(self):
        pass


@pytest.fixture
def fake_db():
    return FakeDB(
        user=SimpleNamespace(
            profession="Marketing", years_of_experience=4.0, resume_text="Led campaigns"
        )
    )
