from fastapi import Depends, HTTPException, Request
from fastapi import status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional
from .decoder import decrypt_jwt
from pydantic import BaseModel
import traceback


class JWTUser(BaseModel):
    issuer: str
    user_id: str
    audience: str
    expiration: int
    issued_at: int
    email: str
    phone: str
    app_metadata: dict
    user_metadata: dict
    role: str
    session_id: str
    is_anonymous: bool


def get_jwt_user(decrypted_token: dict) -> JWTUser:
    return JWTUser(
        issuer=decrypted_token.get("iss"),
        user_id=decrypted_token.get("sub"),
        audience=decrypted_token.get("aud"),
        expiration=decrypted_token.get("exp"),
        issued_at=decrypted_token.get("iat"),
        email=decrypted_token.get("email"),
        phone=decrypted_token.get("phone"),
        app_metadata=decrypted_token.get("app_metadata"),
        user_metadata=decrypted_token.get("user_metadata"),
        role=decrypted_token.get("role"),
        session_id=decrypted_token.get("session_id"),
        is_anonymous=decrypted_token.get("is_anonymous")
    )


class HTTPUserBearer(HTTPBearer):
    async def __call__(self, request: Request) -> Optional[JWTUser]:
        try:
            r = await super().__call__(request)
            token = r.credentials
            decrypted_token = decrypt_jwt(token)
            return get_jwt_user(decrypted_token)
        except HTTPException as ex:
            print(traceback.print_exc())
            assert ex.status_code == status.HTTP_403_FORBIDDEN, ex
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )