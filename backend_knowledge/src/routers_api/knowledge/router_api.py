from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie, Form, Body, Header, status, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse, FileResponse
from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload

from db_api import get_async_session
from routers_api.regusers.verify_user import verify_user_service

from sqlalchemy.ext.asyncio import AsyncSession

from .models import *
from .schemas import *
from .services import group_create_service, get_knowledges, knowledges_create_service, upload_image_service, update_knowledge_service, get_group_service, get_knowledges_in_group, knowledges_open_service, view_file_image_service, delete_knowledge_service, update_knowledge_header_service, delete_group_service

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


# удаление группы
# @router_knowledge_api.delete("/group_delete/{group_id}")
# async def group_delete(group_id: int, session: AsyncSession = Depends(get_async_session)):
#     return await delete_group_service(group_id=group_id, db=session)

 # = Body(...)
# move_to_group: DeleteGroupRequest = Body(...) - ЭТО РАБОЧИЙ ВАРИАНТ
# move_to_group: Optional[int] = Body(...)
# удаление группы
@router_knowledge_api.delete("/group_delete/{group_id}")
async def group_delete(group_id: int, data: DeleteGroupRequest = Body(...), session: AsyncSession = Depends(get_async_session)):    
    return await delete_group_service(group_id=group_id, db=session, move_to_group=data.move_to_group)

# смотреть ответ дипсик по Body параметру чем он отличается от обычно параметра с указанием схемы Pydantic



#получение всех групп
@router_knowledge_api.get("/groups_all/", response_model=list[GroupShemaFull])
async def groups_all(request: Request, session: AsyncSession = Depends(get_async_session)) -> GroupShemaFull:
    # проверка пользователя
    # user_id = await verify_user_service(request=request)

    return await get_group_service(db=session)


# получение всех знаний, только список с заголовками и описанием.
@router_knowledge_api.get("/knowledge_all/", response_model=list[KnowledgesSchema])
async def knowledges_all(request: Request, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:

    return await get_knowledges(db=session)


#получение всех знаний по фильтру слага группы
@router_knowledge_api.get("/knowledges_in_group/{slug}", response_model=list[KnowledgesSchema])
async def knowledges_in_group(slug: str, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:
    return await get_knowledges_in_group(db=session, slug=slug)


#сделал создание знания, переделал уже как надо. Возвращаем целое знание, чтобы открыть его. Так как после создания оно открывается и его можно будет редачить. Открытие со стороны фронта делать надо будет, и роут для открытия надо сделать
@router_knowledge_api.post("/knowledges_create/", response_model=KnowledgesSchemaFull)
async def knowledges_create(knowledge: KnowledgesCreateSchema, session: AsyncSession = Depends(get_async_session)):
    return await knowledges_create_service(db=session, knowledge=knowledge)


# открыть знание, тут фильтр по ID знания. Возможно переделаю на UUID
@router_knowledge_api.get("/knowledges_open/{kn_id}", response_model=KnowledgesSchemaOpen)
async def knowledges_open(kn_id: int, session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchemaFull:    
    return await knowledges_open_service(db=session, kn_id=kn_id)


#создание знания. После создания оно сразу открывается для заполнения. Поэтму тут схема ответа фул знания. Редактирование тела знания будет при открытии знания. При создании мы пишем название и описание знания и валидация идет по KnowledgesSchema. Потом оно открывается, и его заполняем - редактируем по остальным полям.



# Эндпоинт для загрузки изображения. Этот эндпоинт будет срабатывать при вставке изображения в текст контента сразу же, и записывать файл на сервер и строку в БД в таблицу Images. Возвращает ссылку на изображение для его отрисовки на фронте, эта ссылка обрабатывается другим эндпоинтом - serve_file, который описан ниже. В реакт коде ссылка возвращаемая не пишется, она пишется в самом тексте поста который хранится в базе, и потом автоматом рисуется
# response_model=ImageSchema
@router_knowledge_api.post("/upload-image/{knowledge_id}")#тут что то не так с response_model
async def upload_image(request: Request, knowledge_id: int, file: UploadFile = File(...), session: AsyncSession = Depends(get_async_session)):
    return await upload_image_service(request=request, knowledge_id=knowledge_id, file=file, db=session)


# Эндпоинт для отображения на фронте загруженных файлов изображений, то есть чтобы можно было по ссылке обратиться и отобразить файл на фронте. Логику перенести в сервисные функции. В дипсике функция называется serve_file
@router_knowledge_api.get("/uploads/{file_name}")
async def view_file_image(file_name: str):
    return await view_file_image_service(file_name=file_name)


#изменение знания. Меняется и изображение и текст
@router_knowledge_api.put("/knowledges_update/{kn_id}", response_model=KnowledgesSchemaFull)
async def knowledge_update(request: Request, knowledge: KnowledgesUpdateSchema, kn_id: int, session: AsyncSession = Depends(get_async_session)):    
    return await update_knowledge_service(
        request=request,
        knowledge_id=kn_id,
        knowledge_update=knowledge,
        db=session        
    )


#удаление знания
@router_knowledge_api.delete("/delete_knowledge/{knowledge_id}")
async def delete_knowledge(knowledge_id: int, session: AsyncSession = Depends(get_async_session)):
    return await delete_knowledge_service(knowledge_id=knowledge_id, db=session)


# обновление шапки знания
@router_knowledge_api.patch("/knowledge_update_header/{kn_id}", response_model=KnowledgesUpdateHeaderResponseSchema)
async def knowledge_update_header(kn_id: int, knowledge_update: KnowledgesUpdateHeaderSchema, session: AsyncSession = Depends(get_async_session)):    
    return await update_knowledge_header_service(        
        knowledge_id=kn_id,
        knowledge_update=knowledge_update,
        db=session        
    )





# @router_knowledge_api.put("/posts/{post_id}")
# async def update_post(
#     post_id: int,
#     post_update: schemas.PostUpdate,
#     db: AsyncSession = Depends(get_db)
# ):
#     # 1. Получаем текущий пост с изображениями
#     db_post = await services.posts.get_post(db, post_id)
#     if not db_post:
#         raise HTTPException(status_code=404, detail="Post not found")

#     # 2. Извлекаем URL изображений из старого и нового контента
#     old_images = {img.filepath for img in db_post.images}
#     new_images = set(re.findall(r'!\[.*?\]\((.*?)\)', post_update.content))

#     # 3. Находим изображения для удаления
#     images_to_delete = old_images - new_images

#     # от старых отнимаем новые и в это пойдет на удаление
#     # от новых отнимаем старые это пойдет на добавление. Про добавление уточнить


#     # 4. Удаляем изображения
#     for image_url in images_to_delete:
#         await services.images.delete_image_by_url(db, image_url)

#     # 5. Обновляем пост
#     db_post.title = post_update.title
#     db_post.content = post_update.content
#     await db.commit()
#     await db.refresh(db_post)

#     return db_post
