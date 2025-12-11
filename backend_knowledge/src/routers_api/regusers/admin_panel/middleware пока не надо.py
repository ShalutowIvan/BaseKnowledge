# middleware.py
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import json

class AccountActivationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Пропускаем публичные эндпоинты
        public_paths = ['/auth/login', '/auth/register', '/auth/activate', 
                       '/docs', '/openapi.json', '/admin/complete-registration']
        
        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)
        
        # Проверяем, авторизован ли пользователь и активирован ли он
        # (нужно получать информацию о пользователе из токена или сессии)
        # ...
        
        response = await call_next(request)
        return response