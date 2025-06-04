from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie, Form, Body, Header, status, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
# from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload

# from src.db import get_async_session
# from sqlalchemy.ext.asyncio import AsyncSession

from .models import *
from .schemas import *
from .services import *
# from src.regusers.models import User
# from src.regusers.secure import test_token_expire, access_token_decode

from jose.exceptions import ExpiredSignatureError

import requests
import uuid
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from main import UPLOAD_FOLDER


# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
# from src.settings import templates, EXPIRE_TIME, KEY, KEY2, ALG, EXPIRE_TIME_REFRESH, KEY3, KEY4, CLIENT_ID


router_knowledge_api = APIRouter(
    prefix="",
    tags=["Knowledge_api"]
)




#получение всех групп
@router_knowledge_api.get("/groups_all/", response_model=list[GroupShema])
async def groups_all(request: Request, session: AsyncSession = Depends(get_async_session)) -> GroupShema:
    query = select(Group)
    group = await session.scalars(query)    
    return group


# получение всех знаний, только список с заголовками и описанием. 
@router_knowledge_api.get("/knowledge_all/", response_model=list[KnowledgesSchema])
async def knowledges_all(request: Request, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:    
    knowledge = await session.execute(select(Knowledges))    
    context = knowledge.scalars()
    return context


#получение всех знаний по фильтру слага группы
@router_knowledge_api.get("/knowledges_in_group/{slug}", response_model=list[KnowledgesSchema])
async def knowledges_in_group(request: Request, slug: str, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:    
    
    query = select(Knowledges).options(joinedload(Knowledges.group))
    knowledges_gr = await session.scalars(query)
    if slug == "0":
        knowledges_gr = list(knowledges_gr)
    else:
        knowledges_gr = list(filter(lambda x: x.group.slug == slug, knowledges_gr))

    return knowledges_gr


# открыть знание, тут фильтр по слагу знания
@router_knowledge_api.get("/knowledges_open/{slug}", response_model=list[KnowledgesSchemaFull])
async def knowledges_open(request: Request, slug: str, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchemaFull:    
    
    response = await session.scalars(select(Knowledges).where(Knowledges.slug == slug))
    
    return response


#создание знания. После создания оно сразу открывается для заполнения. Поэтму тут схема ответа фул знания. Редактирование тела знания будет при открытии знания. При создании мы пишем название и описание знания и валидация идет по KnowledgesSchema. Потом оно открывается, и его заполняем - редактируем по остальным полям.
#переделать создание поста, у меня не тенутся фото из фронта
@router_knowledge_api.post("/knowledges_create/", response_model=list[KnowledgesSchemaFull])
async def knowledges_create(request: Request, formData: KnowledgesSchema, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchemaFull:
    fake_user = 1
    # Генерируем уникальный ID для поста
    # post_id = str(uuid.uuid4())
    # Создаем новое знание
    # new_knowledge = Knowledges(title=title, description=description, content=content, group_id=group, user_id=fake_user)
    slug = "тут написать формирование слага по транслиту и потом его указать в создании объекта знания"
    new_knowledge = Knowledges(title=title, description=description, group_id=1, user_id=fake_user)
    # Сохраняем пост в "базу данных"
    session.add(new_knowledge)
    await session.commit()
    return new_knowledge


####################################################################

# из дипсика ответы, их тут разобрать надо

async def knowledges_create_service(db: AsyncSession, knowledge: KnowledgesCreateSchema) -> KnowledgesSchemaFull:
    # Создаем новое знание
    db_knowledge = Knowledges(**knowledge.model_dump())#преобразование модели пайдентик в словарь питона
    db.add(db_knowledge)
    await db.commit()
    await db.refresh(db_knowledge)
    return db_knowledge



@router_knowledge_api.post("/knowledges_create/", response_model=KnowledgesSchemaFull)
async def knowledges_create(
    knowledges: schemas.PostCreate,
    session: AsyncSession = Depends(get_async_session)
):
    return await posts.create_post(session, knowledges)

# тут типа фотка грузится из контента по ссылке, и текст грузится в базу. Как срабатывает урл для загрузки фотог смотреть на фронте...!!!!!!!ост тут

####################################################################

# Эндпоинт для загрузки изображения. Не понятно как будет срабатывать загрузка изображения...
@router_knowledge_api.post("/upload-image/", response_model=ImageSchema)
async def upload_image(request: Request, file: UploadFile = File(...), session: AsyncSession = Depends(get_async_session)):
    try:
        # 1. Сохраняем файл на сервере
        filename, filepath = await save_uploaded_file(file, UPLOAD_FOLDER)#эту функцию нужно импортировать из services.py
        
        # 2. Формируем полный URL
        base_url = str(request.base_url)  # Получаем базовый URL сервера
        print("тут базовый урл при загрузке изображения")
        print(base_url)
        image_url = f"{base_url}uploads/{filename}".replace("//uploads", "/uploads")
        
        # 3. Создаем запись в БД (сохраняем относительный путь)
        db_image = await add_record_image_in_base(
            db=session,
            filename=filename,
            filepath=f"/uploads/{filename}"  # Сохраняем относительный путь
        )
        
        # 4. Возвращаем ответ с полным URL
        return {
            "id": db_image.id,
            "filename": db_image.filename,
            "url": image_url,  # Полный URL для клиента
            "created_at": db_image.created_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )


#изменение знания. Меняется и изображение и текст
@router_knowledge_api.put("/knowledges_update/{kn_id}", response_model=list[KnowledgesSchemaFull])
async def knowledge_update(request: Request = None, kn_id: int, knowledge: KnowledgesCreateSchema, session: AsyncSession = Depends(get_async_session)):
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