# dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import secrets
import uuid
from ..models import UserRole
from ..secure import access_token_decode


# def generate_activation_code() -> str:
#     """Генерация уникального кода активации"""
#     return str(uuid.uuid4()).replace('-', '')[:12].upper()

# def generate_invitation_token() -> str:
#     """Генерация токена для приглашения администратора"""
#     return secrets.token_urlsafe(32)

# # --- Dependencies ---
# def get_current_user(
#     db: Session = Depends(get_db),
#     credentials: HTTPAuthorizationCredentials = Depends(security)
# ) -> User:
#     """Получение текущего пользователя из JWT токена"""
#     # Реализация получения пользователя из токена
#     # ...


security = HTTPBearer()


async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Проверка, что пользователь является администратором"""

    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    try:
        check = await access_token_decode(acces_token=str(token))

        if check[3] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator role required"
            )

        # проверку на бан пока не делал
        # if user.is_banned:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Ваш аккаунт заблокирован"
        #     )

        return int(check[1])

    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )



# async def require_activated_user(user: User = Depends(get_current_user)) -> User:
#     """Проверка, что пользователь активировал аккаунт"""
#     if not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Аккаунт не активирован"
#         )
#     return user


async def require_active_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Проверка, что пользователь является администратором"""

    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    try:
        check = await access_token_decode(acces_token=str(token))

        if check[0]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user is already activated"
            )        

        return int(check[1])

    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
