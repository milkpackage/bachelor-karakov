import models

def test_emotion_type_enum():
    assert models.EmotionType.JOY == "joy"
    assert models.EmotionType.SADNESS == "sadness"

def test_note_results_response():
    resp = models.NoteResultsResponse(confidence=0.9, emotion_type=models.EmotionType.JOY)
    assert resp.confidence == 0.9
    assert resp.emotion_type == models.EmotionType.JOY

def test_chat_message_response():
    resp = models.ChatMessageResponse(message="hi")
    assert resp.message == "hi"