import pytest
from libs.gpt import message

def test_gpt_message(monkeypatch):
    # Мокаємо клієнта, якщо потрібно, щоб не викликати справжній OpenAI
    monkeypatch.setattr("libs.gpt.chat.client.responses.create", lambda **kwargs: type("Resp", (), {"output_text": "test"})())
    result = message("Hello")
    assert isinstance(result, str)