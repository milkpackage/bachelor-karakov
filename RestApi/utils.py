import models
from libs.supaclient import supabase_client
from typing import List, Union
from libs.jwt_token import JWTUser
from fastapi.responses import JSONResponse


def return_error(status_code: int, message: str):
    return JSONResponse(
            content={
                "status": "error",
                "message": message
            },
            status_code=status_code
        )


def is_user_premium(user: JWTUser) -> bool:
    """
    Check if the user is premium.
    """
    found_rows = (
        supabase_client.table("is_premium").select("*")
        .eq("user_id", user.user_id)
        .eq("is_premium", True)
        .execute()
    ).data

    return len(found_rows) > 0


def get_conversation(
        user_id: str
    ) -> List[models.Message]:
    """
    Get the conversation history for a user.
    Args:
        user_id (str): The user ID.
    Returns:
        List[models.Message]: The conversation history.
    """
    previous_messages = (
        supabase_client.table("chat_messages")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .limit(5)
        .execute()
    ).data

    conversation: List[models.Message] = list()
    for message in previous_messages:
        latest_message = models.Message(
            role=message["role"],
            content=message["message"]
        )

        conversation.append(latest_message)
    return conversation