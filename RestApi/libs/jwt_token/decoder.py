from fastapi import HTTPException
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
load_dotenv()


JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"


def decrypt_jwt(access_token: str) -> dict:
    try:
        payload = jwt.decode(token=access_token, key=JWT_SECRET, algorithms=[JWT_ALGORITHM], audience="authenticated")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")

