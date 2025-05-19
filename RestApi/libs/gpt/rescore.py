from .client import client, DEFAULT_MODEL, read_prompt_file
import json
import models


SYSTEM_PROMPT = read_prompt_file("rescore")


def rescore_user_emotion(
        message: str,
        emotion: str
        ) -> models.NoteResultsResponse:
    
    formatted_message = dict(
        message=message,
        emotion=emotion
    )

    response = client.responses.parse(
        model=DEFAULT_MODEL,
        instructions=SYSTEM_PROMPT,
        input=json.dumps(formatted_message),
        text_format=models.NoteResultsResponse,
    )
    result = response.output_parsed
    return result