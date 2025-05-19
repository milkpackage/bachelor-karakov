from fastapi import FastAPI, Request, UploadFile, File, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from libs.jwt_token import HTTPUserBearer, JWTUser
from libs.supaclient import supabase_client
from libs import gpt
import models
from emotion_predictor import predict_emotion
import logging
import utils


logging.basicConfig(level=logging.INFO)

app = FastAPI()
auth_scheme = HTTPUserBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔓 Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # 🔓 Allow all HTTP methods
    allow_headers=["*"],  # 🔓 Allow all headers
)





@app.post("/rescore", response_model=models.NoteResultsResponse)
async def rescore(
    message: str,
    emotion: models.EmotionType,
    user: HTTPAuthorizationCredentials = Depends(auth_scheme),
) -> models.NoteResultsResponse:
    if not utils.is_user_premium(user):
        return utils.return_error(status_code=401, message="User is not premium")

    rescored_emotion: models.NoteResultsResponse = predict_emotion(
        text=message,
    )
    print(rescored_emotion)

    note_id = supabase_client.table("moods").insert({
        "user_id": user.user_id,
        "note": message,
        "selected_emotion": emotion,
        "calculated_confidence": rescored_emotion.confidence,
        "calculated_emotion": rescored_emotion.emotion_type
    }).execute().data[0]["id"]

    return rescored_emotion


@app.post("/chat", response_model=models.ChatMessageResponse)
async def message(
    message: str,
    user: HTTPAuthorizationCredentials = Depends(auth_scheme)
):
    if not utils.is_user_premium(user):
        return utils.return_error(status_code=401, message="User is not premium")
    
    # Reading previous messages
    previous_messages = (
        supabase_client.table("chat_messages")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    ).data

    output_text: str = gpt.message(
        text=message,
        conversation=utils.get_conversation(user_id=user.user_id)
    )

    supabase_client.table("chat_messages").insert({
        "user_id": user.user_id,
        "message": message,
        "role": models.MessageRole.user
    }).execute()

    supabase_client.table("chat_messages").insert({
        "user_id": user.user_id,
        "message": output_text,
        "role": models.MessageRole.bot
    }).execute()

    return models.ChatMessageResponse(
        message=output_text
    )