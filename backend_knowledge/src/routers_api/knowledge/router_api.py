from fastapi import APIRouter, Depends, Request, Body, UploadFile, File, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse, FileResponse
from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload

from db_api import get_async_session
from routers_api.regusers.verify_user import verify_user_service

from sqlalchemy.ext.asyncio import AsyncSession

from .models import *
from .schemas import *
from .services import *

from routers_api.regusers.verify_user import verify_user_service
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
async def group_create(
    group: GroupShema, 
    user_id: int = Depends(verify_user_service),
    session: AsyncSession = Depends(get_async_session)):
    return await group_create_service(user_id=user_id, db=session, group=group)


# удаление группы
@router_knowledge_api.delete("/group_delete/{group_id}")
async def group_delete(
    group_id: int, 
    user_id: int = Depends(verify_user_service),
    data: DeleteGroupRequest = Body(...), 
    session: AsyncSession = Depends(get_async_session)):    
    return await delete_group_service(user_id=user_id, group_id=group_id, db=session, move_to_group=data.move_to_group)


# переименование группы
@router_knowledge_api.patch("/group_name_update/{group_id}", response_model=GroupShemaFull)
async def group_name_update(
    group_id: int,
    group_name_update: GroupShema,
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> GroupShemaFull:
    return await group_name_update_service(user_id=user_id, group_id=group_id, group_name_update=group_name_update, db=session)


#получение всех групп
@router_knowledge_api.get("/groups_all/", response_model=list[GroupShemaFull])
async def groups_all(
    user_id: int = Depends(verify_user_service),
    session: AsyncSession = Depends(get_async_session)) -> GroupShemaFull:    
    return await groups_all_service(user_id=user_id, db=session)


# получение всех знаний, только список с заголовками и описанием.
@router_knowledge_api.get("/knowledge_all/", response_model=list[KnowledgesSchema])
async def knowledges_all(
    user_id: int = Depends(verify_user_service),
    session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchema:
    return await knowledges_all_service(user_id=user_id, db=session)


#получение всех знаний по фильтру слага группы
@router_knowledge_api.get("/knowledges_in_group/{slug}", response_model=PaginatedResponseKnowledge)
async def knowledges_in_group(
    slug: str, 
    page: int = Query(1, ge=1, description="Номер страницы (начинается с 1)"),
    per_page: int = Query(10, ge=1, le=50, description="Количество элементов на странице"),
    search: str = Query(None),
    search_type: str = "plain",    
    filter_change_date: bool = Query(False, description="Фильтровать по дате изменения"),
    user_id: int = Depends(verify_user_service),
    session: AsyncSession = Depends(get_async_session)) -> PaginatedResponseKnowledge:
    return await knowledges_in_group_service(search=search, search_type=search_type, slug=slug, page=page, per_page=per_page, filter_change_date=filter_change_date, user_id=user_id, db=session)


# создание знания
@router_knowledge_api.post("/knowledges_create/", response_model=KnowledgesSchema)
async def knowledges_create(
    knowledge: KnowledgesCreateSchema, 
    user_id: int = Depends(verify_user_service),    
    session: AsyncSession = Depends(get_async_session)):
    return await knowledges_create_service(user_id=user_id, db=session, knowledge=knowledge)


# открыть знание, тут фильтр по ID знания. Возможно переделаю на UUID
@router_knowledge_api.get("/knowledges_open/{kn_id}", response_model=KnowledgesSchemaOpen)
async def knowledges_open(
    kn_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchemaFull:    
    return await knowledges_open_service(user_id=user_id, db=session, kn_id=kn_id)



#энпоинт для открытия ссылки если для знания открыт свободный доступ. без запроса юзера
@router_knowledge_api.get("/knowledges_open_free/{slug}", response_model=KnowledgesSchemaOpen)
async def knowledges_open_free(
    slug: str,     
    session: AsyncSession = Depends(get_async_session)) -> KnowledgesSchemaFull:    
    return await knowledges_open_free_service(db=session, slug=slug)


# Эндпоинт для загрузки изображения. Этот эндпоинт будет срабатывать при вставке изображения в текст контента сразу же, и записывать файл на сервер и строку в БД в таблицу Images. Возвращает ссылку на изображение для его отрисовки на фронте, эта ссылка обрабатывается другим эндпоинтом - serve_file, который описан ниже. В реакт коде ссылка возвращаемая не пишется, она пишется в самом тексте знания который хранится в базе, и потом автоматом рисуется. 
# response_model=ImageSchema
@router_knowledge_api.post("/upload-image/{knowledge_id}")#тут что то не так с response_model
async def upload_image(
    request: Request, 
    knowledge_id: int, 
    user_id: int = Depends(verify_user_service), 
    file: UploadFile = File(...), 
    session: AsyncSession = Depends(get_async_session)):
    return await upload_image_service(request=request, knowledge_id=knowledge_id, file=file, db=session)


# Эндпоинт для отображения на фронте загруженных файлов изображений, то есть чтобы можно было по ссылке обратиться и отобразить файл на фронте. Тут пользак не проверяется решил так оставить. Так как это просто просмотр файла
@router_knowledge_api.get("/uploads/{file_name}")
async def view_file_image(file_name: str):
    return await view_file_image_service(file_name=file_name)


#изменение знания. Меняется и изображение и текст
@router_knowledge_api.put("/knowledges_update/{kn_id}", response_model=KnowledgesSchemaFull)
async def knowledge_update(
    request: Request, 
    knowledge: KnowledgesUpdateSchema, 
    kn_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):    
    return await update_knowledge_service(
        request=request,
        user_id=user_id,
        knowledge_id=kn_id,
        knowledge_update=knowledge,
        db=session        
    )


#удаление знания
@router_knowledge_api.delete("/delete_knowledge/{knowledge_id}")
async def delete_knowledge(
    knowledge_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_knowledge_service(user_id=user_id, knowledge_id=knowledge_id, db=session)


# обновление шапки знания
@router_knowledge_api.patch("/knowledge_update_header/{kn_id}", response_model=KnowledgesUpdateHeaderResponseSchema)
async def knowledge_update_header(
    kn_id: int, 
    knowledge_update: KnowledgesUpdateHeaderSchema, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)
    ):    
    return await update_knowledge_header_service(user_id=user_id, knowledge_id=kn_id, knowledge_update=knowledge_update, db=session)



# сохранение поиска знаний, скопировал эндпониты, пока не исправил...

# @router_knowledge_api.post("/saved_searches/", response_model=SavedSearchResponse)
# async def create_saved_search(
#     search_data: SavedSearchCreate,
#     session: AsyncSession = Depends(get_async_session),
#     user_id: int = Depends(verify_user_service)
# ):
#     return await create_saved_search_service(
#         user_id=user_id,
#         db=session,
#         name_search=search_data.name_search,
#         search_query=search_data.search_query,
#         search_type=search_data.search_type,
#         group_slug=search_data.group_slug
#     )


# @router_knowledge_api.get("/saved_searches/", response_model=List[SavedSearchResponse])
# async def get_saved_searches(
#     group_slug: str = None,
#     session: AsyncSession = Depends(get_async_session),
#     user_id: int = Depends(verify_user_service)
# ):
#     return await get_saved_searches_service(
#         user_id=user_id,
#         db=session,
#         group_slug=group_slug
#     )


# @router_knowledge_api.delete("/saved_searches/{search_id}")
# async def delete_saved_search(
#     search_id: int,
    # session: AsyncSession = Depends(get_async_session),
    # user_id: int = Depends(verify_user_service)
# ):
#     success = await delete_saved_search_service(
#         user_id=user_id,
#         search_id=search_id,
#         db=session
#     )
#     return {"message": "Сохраненный поиск удален"}


# Ниже сохранение списка вкладок или табов

# роут для отображения списка сохраненных табов. 
@router_knowledge_api.get("/get_tab_lists/", response_model=PaginatedResponseSavedTabs)
async def get_tab_lists(
    page: int = Query(1, ge=1, description="Номер страницы (начинается с 1)"),
    per_page: int = Query(10, ge=1, le=50, description="Количество элементов на странице"),
    session: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(verify_user_service)
):
    """Получить все мои списки вкладок"""
    return await get_tab_lists_service(db=session, user_id=user_id, page=page, per_page=per_page)


#создание табов
@router_knowledge_api.post("/create_tab_list/", response_model=TabListSchema)
async def create_tab_list(
    tab_list_data: TabListCreateSchema,
    session: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(verify_user_service)
):
    """Создать новый список вкладок из текущих открытых"""
    return await create_tab_list_service(db=session, user_id=user_id, tab_list_data=tab_list_data)


#функция открытия списка вкладок, открытие знаний по списку вкладок
@router_knowledge_api.post("/open_tab_list/{tab_list_id}/open", response_model=list[KnowledgesSchemaOpen])
async def open_tab_list(
    tab_list_id: int,
    session: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(verify_user_service)
):
    """Открыть список вкладок - возвращает данные для открытия вкладок"""
    return await open_tab_list_service(db=session, user_id=user_id, tab_list_id=tab_list_id)


# Удалить список вкладок
@router_knowledge_api.delete("/delete_tab_list/{tab_list_id}")
async def delete_tab_list(
    tab_list_id: int,
    session: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(verify_user_service)
    ):    
    return await delete_tab_list_service(db=session, user_id=user_id, tab_list_id=tab_list_id)


# редактирование название и описания списка. 
@router_knowledge_api.patch("/change_tab_list/", response_model=TabListBaseSchema)
async def change_tab_list(    
    tab_list_data: TabListBaseSchema,
    session: AsyncSession = Depends(get_async_session),
    user_id: int = Depends(verify_user_service)
    ):    
    return await change_tab_list_service(db=session, user_id=user_id, tab_list_data=tab_list_data)




# конец списка вкладок


