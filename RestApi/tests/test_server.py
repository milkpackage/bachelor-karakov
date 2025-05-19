import pytest
from fastapi.testclient import TestClient
from server import app
import models

client = TestClient(app)

def test_return_error():
    response = client.post("/rescore", data={"message": "test", "emotion": "joy"})
    assert response.status_code in (401, 422)

def test_chat_unauthorized():
    response = client.post("/chat", data={"message": "Hello"})
    assert response.status_code == 401 or response.status_code == 422

# Додайте більше тестів з валідним токеном, якщо є можливість його отримати
