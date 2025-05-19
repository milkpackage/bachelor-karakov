import pytest
from emotion_predictor import get_emotion_predictor, predict_emotion
import models

def test_predict_emotion_type_and_confidence(monkeypatch):
    predictor = get_emotion_predictor()
    emotion_type, confidence = predictor.predict_emotion_with_confidence("I am happy")
    assert isinstance(emotion_type, models.EmotionType)
    assert 0 <= confidence <= 1

def test_predict_emotion_response():
    result = predict_emotion("I am sad")
    assert isinstance(result, models.NoteResultsResponse)
    assert 0 <= result.confidence <= 1
    assert isinstance(result.emotion_type, models.EmotionType)