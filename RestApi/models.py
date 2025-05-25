from enum import StrEnum
from pydantic import BaseModel


class EmotionType(StrEnum):
    ANGER = "anger"
    DISGUST = "disgust"
    FEAR = "fear"
    JOY = "joy"
    SADNESS = "sadness"
    SURPRISE = "surprise"
    TRUST = "trust"
    ANTICIPATION = "anticipation"
    NEUTRAL = "neutral"


class NoteResultsResponse(BaseModel):
    confidence: float
    emotion_type: EmotionType


class MessageRole(StrEnum):
    user = "user"
    bot = "assistant"
    
class ChatMessageResponse(BaseModel):
    message: str


class Message(BaseModel):
    role: MessageRole
    content: str

    def export(self) -> dict:
        return {
            "role": self.role,
            "content": self.content
        }
    

class TestResult(BaseModel):
    id: str
    user_id: str
    total_score: int
    depression_score: int
    anxiety_score: int
    stress_score: int
    created_at: str

    
class Mood(BaseModel):
    id: str
    user_id: str
    selected_emotion: EmotionType
    note: str
    calculated_emotion: EmotionType
    calculated_confidence: float
