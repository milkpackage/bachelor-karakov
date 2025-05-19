from .client import client, DEFAULT_MODEL, read_prompt_file
import models
from typing import List, Union

SYSTEM_PROMPT = read_prompt_file("chat")


def message(
        text: str,
        conversation: Union[List[models.Message], None] = None,
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

    if not isinstance(conversation, (list, tuple)):
        conversation = list()
    
    conversation.append(models.Message(
        role=models.MessageRole.user,
        content=text
    ))

    if len(conversation) > max_memory:
        conversation = conversation[-max_memory:]

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