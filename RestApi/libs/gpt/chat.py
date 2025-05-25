from .client import client, DEFAULT_MODEL, read_prompt_file
from ..supaclient import supabase_client
import models
from typing import List, Union
import json


SYSTEM_PROMPT = read_prompt_file("chat")

USER_MESSAGE_PROMPT_TEMPLATE = """
User message: "{}"

You have access to the user's last test results and mood.

Test results description:
- Depression score (higher is worse)
- Anxiety score (higher is worse)
- Stress score (higher is worse)
- Total score (higher is worse)

Test results in JSON format:
{}

User's last mood.
- Selected emotion (the emotion the user selected)
- Calculated emotion (the emotion the ML model predicts)
- Calculated confidence (the confidence of the ML model's prediction)

User mood in JSON format:
{}
"""

def prepare_last_test_results(
    user_id: str
) -> models.TestResult:
    """
    Prepare the test results for a user.
    Args:
        user_id (str): The ID of the user.
    Returns:
        models.TestResult: A list of test results for the user.
    """
    response = (
        supabase_client.table("test_results")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .single()
        .execute()
    )

    if not response.data:
        return None

    return models.TestResult(**response.data) if response.data else None

def prerare_last_mood(
    user_id: str
) -> models.Mood:
    """
    Prepare the last mood for a user.
    Args:
        user_id (str): The ID of the user.
    Returns:
        models.TestResult: The last mood for the user.
    """
    response = (
        supabase_client.table("moods")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .single()
        .execute()
    )
    
    if not response.data:
        return None

    return models.Mood(**response.data) if response.data else None


def prepare_input(
    user_id: str,    
    user_message: str,    
) -> str:
    test_result: models.TestResult = prepare_last_test_results(user_id=user_id)
    last_mood: models.Mood = prerare_last_mood(user_id=user_id)
    prompt = USER_MESSAGE_PROMPT_TEMPLATE.format(
        user_message,
        dict(
            anxiety_score=test_result.anxiety_score,
            depression_score=test_result.depression_score,
            stress_score=test_result.stress_score,
            total_score=test_result.total_score,
        ) if test_result else dict(error="No test results found"),
        dict(
            selected_emotion=last_mood.selected_emotion,
            calculated_emotion=last_mood.calculated_emotion,
            calculated_confidence=last_mood.calculated_confidence,
        ) if last_mood else dict(error="No mood found")
    )
    return prompt

def load_memory(
        user_id: str,
        limit: int = 6
) -> List[models.Message]:
    # Reading previous messages
    response = (
        supabase_client.table("chat_messages")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    if not response.data:
        return list()

    return [
        models.Message(
            role=message["role"],
            content=message["message"]
        ) for message in response.data
        if message["role"] in [models.MessageRole.user, models.MessageRole.bot]
    ]


def message(
        user_id: str,
        text: str,
        max_memory: int = 5,
    ) -> models.NoteResultsResponse:
    """
    Send a message to the chat model and get a response.
    Args:
        message (str): The message to send.
        conversation (List[models.Message], optional): The conversation history. Defaults to None.
        max_memory (int, optional): The maximum number of messages to keep in memory. Defaults to 5.
    Returns:
        str: The response from the chat model.
    """
    print('prepare_last_test_results', user_id)

    print(f"User ID: {user_id}")
    conversation: List[models.Message] = load_memory(user_id=user_id, limit=max_memory)

    prompt: str = prepare_input(
        user_id=user_id,
        user_message=text
    )

    conversation.append(models.Message(
        role=models.MessageRole.user,
        content=prompt
    ))

    exported_conversation = [
        message.export() for message in conversation
    ]


    response = client.responses.create(
        model=DEFAULT_MODEL,
        instructions=SYSTEM_PROMPT,
        input=exported_conversation

    )
    result = response.output_text
    return result