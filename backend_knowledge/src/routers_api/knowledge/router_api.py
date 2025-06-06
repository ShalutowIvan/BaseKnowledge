from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie, Form, Body, Header, status, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload

from db_api import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession

from .models import *
from .schemas import *
from .services import group_create_service, get_knowledges, get_knowledge, knowledges_create_service, upload_image_service, update_knowledge, get_group_service, get_knowledges_in_group, knowledges_open_service
# from src.regusers.models import User
# from src.regusers.secure import test_token_expire, access_token_decode

# from jose.exceptions import ExpiredSignatureError

# import requests
# import uuid
import os
import sys
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))



# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
# from src.settings import templates, EXPIRE_TIME, KEY, KEY2, ALG, EXPIRE_TIME_REFRESH, KEY3, KEY4, CLIENT_ID


router_knowledge_api = APIRouter(
    prefix="",
    tags=["Knowledge_api"]
)


# создание группы
@router_knowledge_api.post("/group_create/", response_model=GroupShemaFull)
async def group_create(group: GroupShema, session: AsyncSession = Depends(get_async_session)):
    return await group_create_service(db=session, group=group)


#получение всех групп
@router_knowledge_api.get("/groups_all/", response_model=list[GroupShemaFull])
async def groups_all(session: AsyncSession = Depends(get_async_session)) -> GroupShemaFull:
    return await get_group_service(db=session)


# получение всех знаний, только список с заголовками и описанием.
@router_knowledge_api.get("/knowledge_all/", response_model=list[KnowledgesSchema])
async def knowledges_all(session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:    
    return await get_knowledges(db=session)


#получение всех знаний по фильтру слага группы
@router_knowledge_api.get("/knowledges_in_group/{slug}", response_model=list[KnowledgesSchema])
async def knowledges_in_group(slug: str, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:
    return await get_knowledges_in_group(db=session, slug=slug)


#сделал создание знания, переделал уже как надо. Возвращаем целое знание, чтобы открыть его. Так как после создания оно открывается и его можно будет редачить. Открытие со стороны фронта делать надо будет, и роут для открытия надо сделать
@router_knowledge_api.post("/knowledges_create/", response_model=KnowledgesSchemaFull)
async def knowledges_create(knowledge: KnowledgesCreateSchema, session: AsyncSession = Depends(get_async_session)):
    return await knowledges_create_service(db=session, knowledge=knowledge)


# открыть знание, тут фильтр по слагу знания
@router_knowledge_api.get("/knowledges_open/{slug}", response_model=KnowledgesSchemaFull)
async def knowledges_open(slug: str, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchemaFull:    
    return await knowledges_open_service(db=session, slug=slug)


#создание знания. После создания оно сразу открывается для заполнения. Поэтму тут схема ответа фул знания. Редактирование тела знания будет при открытии знания. При создании мы пишем название и описание знания и валидация идет по KnowledgesSchema. Потом оно открывается, и его заполняем - редактируем по остальным полям.


####################################################################

# из дипсика ответы, их тут разобрать надо

# тут типа фотка грузится из контента по ссылке, и текст грузится в базу. Как срабатывает урл для загрузки фотог смотреть на фронте...!!!!!!!ост тут

####################################################################





# Эндпоинт для загрузки изображения. Не понятно как будет срабатывать загрузка изображения...
@router_knowledge_api.post("/upload-image/", response_model=ImageSchema)
async def upload_image(request: Request, file: UploadFile = File(...), session: AsyncSession = Depends(get_async_session)):
    return await upload_image_service(request=request, file=file, db=session)


#изменение знания. Меняется и изображение и текст
@router_knowledge_api.put("/knowledges_update/{kn_id}", response_model=list[KnowledgesSchemaFull])
async def knowledge_update(request: Request, knowledge: KnowledgesCreateSchema, kn_id: int, session: AsyncSession = Depends(get_async_session)):
    # Получаем текущие изображения поста
    current_knowledge = await get_knowledge(db=session, knowledge_id=kn_id)
    current_images = [img.filepath for img in current_knowledge.images]
    
    return await update_knowledge(
        db=session,
        knowledge_id=kn_id,
        knowledge=knowledge,
        current_images=current_images
    )


# ост урл для удаления знания
# Эндпоинт для загрузки изображения. Не понятно как будет срабатывать загрузка изображения... при изменении у меня удаляются лишние фото, а как они добавляются?