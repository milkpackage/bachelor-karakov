from openai import OpenAI
import os
from pathlib import Path


client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

DEFAULT_MODEL = "gpt-4o-mini"

DATA_DIR = Path() / "data"
PROMPTS_DIR = DATA_DIR / "prompts"


def read_prompt_file(name: str) -> str:
    """
    Read the prompt file and return its content.
    """
    file_path = PROMPTS_DIR / f"{name}.txt"
    with open(file_path, "r") as file:
        data = file.read()
    return data