from app.services.interview_service import analyze_delivery_metrics


def test_clean_answer_gets_perfect_pacing_and_full_clarity():
    transcript = " ".join(["clear"] * 25)  # 25 words in 10s = 150 WPM
    result = analyze_delivery_metrics(transcript, 10)

    assert result["word_count"] == 25
    assert result["wpm"] == 150
    assert result["pacing_label"] == "Perfect"
    assert result["pacing_score"] == 100
    assert result["filler_count"] == 0
    assert result["clarity_score"] == 100


def test_filler_words_are_counted_and_penalise_clarity():
    transcript = "Um like you know basically this is my answer today"
    result = analyze_delivery_metrics(transcript, 10)

    assert result["filler_count"] >= 4
    assert set(result["filler_words_found"]) >= {"um", "like", "you know", "basically"}
    assert result["clarity_score"] < 100
    assert "filler word(s)" in result["tips"]


def test_fast_speech_is_flagged():
    transcript = " ".join(["word"] * 60)  # 360 WPM
    result = analyze_delivery_metrics(transcript, 10)

    assert result["pacing_label"] == "Too Fast"
    assert result["pacing_score"] == 40


def test_empty_transcript_is_safe():
    result = analyze_delivery_metrics("", 0)

    assert result["word_count"] == 0
    assert result["duration_seconds"] == 1
    assert result["clarity_score"] >= 0
