from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie, Form, Body, Header, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
# from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload

# from src.db import get_async_session
# from sqlalchemy.ext.asyncio import AsyncSession

# from .models import *
# from .schemas import *
# from src.regusers.models import User
# from src.regusers.secure import test_token_expire, access_token_decode

from jose.exceptions import ExpiredSignatureError

import requests

# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
# from src.settings import templates, EXPIRE_TIME, KEY, KEY2, ALG, EXPIRE_TIME_REFRESH, KEY3, KEY4, CLIENT_ID


router_knowledge_api = APIRouter(
    prefix="",
    tags=["Knowledge_api"]
)



@router_knowledge_api.get("/")
def home():    
    res = {"fio": "Вася Васькин"}
    return res


# @router_knowledge_api.get("/api")
# def get_data():
#     return {"message": "Hello from FastAPI!", "items": [1, 2, 3]}