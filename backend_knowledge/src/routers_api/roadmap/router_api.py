from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie, Form, Body, Header, status
# from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
# from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload
from pydantic import EmailStr

from db_api import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession

# from .models import *
from .schemas import *
from .services import *
# from src.regusers.models import User
# from src.regusers.secure import test_token_expire, access_token_decode
# import requests
from fastapi.security import HTTPBearer
from routers_api.regusers.verify_user import verify_user_service


router_roadmap_api = APIRouter(
    prefix="",
    tags=["RoadMap_api"]
)


#запрос списка мапов
@router_roadmap_api.get("/roadmaps_all/", response_model=list[RoadmapsSchema])
async def roadmaps_all(user_id: int = Depends(verify_user_service), session: AsyncSession = Depends(get_async_session)) -> RoadmapsSchema:
    return await get_roadmaps(user_id=user_id, db=session)


# создание проекта
# @router_roadmap_api.post("/project_create/", response_model=ProjectsSchema)
# async def project_create(request: Request, project: ProjectsCreateSchema, session: AsyncSession = Depends(get_async_session)) -> ProjectsSchema:
#     return await project_create_service(request=request, db=session, project=project)


# # запрос проекта при открытии
# @router_roadmap_api.get("/project_get/{project_id}", response_model=ProjectsSchema)
# async def project_get_open(request: Request, project_id: int, session: AsyncSession = Depends(get_async_session)) -> ProjectsSchema:
#     return await get_project_open(request=request, project_id=project_id, db=session)


# # запрос секций в проекте
# @router_roadmap_api.get("/section_project_all/{project_id}", response_model=list[SectionsSchema])
# async def section_project_all(request: Request, project_id: int, session: AsyncSession = Depends(get_async_session)) -> SectionsSchema:
#     return await get_sections_project(request=request, project_id=project_id, db=session)


# # изменение шапки проекта
# @router_roadmap_api.patch("/project_update_header/{project_id}", response_model=ProjectsCreateSchema)
# async def project_update_header(request: Request, project_id: int, project_update: ProjectsCreateSchema, session: AsyncSession = Depends(get_async_session)) -> ProjectsCreateSchema:    
#     return await update_project_header_service(request=request, project_id=project_id, project_update=project_update, db=session)


# # создание секции
# @router_roadmap_api.post("/section_create/{project_id}", response_model=SectionsSchema)
# async def section_create(request: Request, project_id: int, section: SectionsCreateSchema, session: AsyncSession = Depends(get_async_session)) -> SectionsSchema:
#     return await section_create_service(request=request, project_id=project_id, db=session, section=section)


# # изменение шапки секции
# @router_roadmap_api.patch("/section_update_header/{project_id}/{section_id}", response_model=SectionsCreateSchema)
# async def section_update_header(request: Request, project_id: int, section_id: int, section_update: SectionsCreateSchema, session: AsyncSession = Depends(get_async_session)) -> SectionsCreateSchema:    
#     return await update_section_header_service(request=request, project_id=project_id, section_id=section_id, section_update=section_update, db=session)


# # запрос тасок в разделе
# @router_roadmap_api.get("/task_section_all/{project_id}/{section_id}", response_model=list[TasksSchema])
# async def section_project_all(request: Request, project_id: int, section_id: int, session: AsyncSession = Depends(get_async_session)) -> TasksSchema:
#     return await get_tasks_section(request=request, project_id=project_id, section_id=section_id, db=session)



# # запрос секции при открытой секции
# @router_roadmap_api.get("/section_get/{project_id}/{section_id}", response_model=SectionsSchema)
# async def section_get_open(request: Request, project_id: int, section_id: int, session: AsyncSession = Depends(get_async_session)) -> SectionsSchema:
#     return await get_section_open(request=request, project_id=project_id, section_id=section_id, db=session)


# # начала с этого роута по созданию задачи. Фронт пока не исправлял!!!!!!!!!!!!!! Сделал только создание задачи на фронте. Ост тут на фронте!!!!!

# # создание задачи
# @router_roadmap_api.post("/task_create/{project_id}/{section_id}", response_model=TasksSchema)
# async def task_create(request: Request, project_id: int, section_id: int, task: TaskCreateSchema, session: AsyncSession = Depends(get_async_session)) -> TasksSchema:
#     return await task_create_service(request=request, project_id=project_id, section_id=section_id, db=session, task=task)


# # открыть задачу, тут фильтр по ID задачи. Возможно переделаю на UUID
# @router_roadmap_api.get("/task_open/{project_id}/{task_id}", response_model=TaskOpenSchema)
# async def task_open(request: Request, project_id: int, task_id: int, session: AsyncSession = Depends(get_async_session)) -> TaskOpenSchema:    
#     return await task_open_service(request=request, project_id=project_id, task_id=task_id, db=session)


# #изменение задачи. Меняется только текст в контенте
# @router_roadmap_api.put("/task_update/{project_id}/{task_id}", response_model=TaskOpenSchema)
# async def task_update(request: Request, project_id: int, task_update: TaskUpdateSchema, task_id: int, session: AsyncSession = Depends(get_async_session)):    
#     return await update_task_service(request=request, project_id=project_id, task_id=task_id, task_update=task_update, db=session)


# # изменение шапки задачи
# @router_roadmap_api.patch("/task_update_header/{project_id}/{task_id}", response_model=TaskUpdateHeaderSchema)
# async def task_update_header(request: Request, project_id: int, task_id: int, task_update: TaskCreateSchema, session: AsyncSession = Depends(get_async_session)) -> TaskUpdateHeaderSchema:
#     return await update_task_header_service(request=request, project_id=project_id, task_id=task_id, task_update=task_update, db=session)


# #удаление задачи
# @router_roadmap_api.delete("/delete_task/{project_id}/{task_id}")
# async def delete_task(request: Request, project_id: int, task_id: int, session: AsyncSession = Depends(get_async_session)):
#     return await delete_task_service(request=request, project_id=project_id, task_id=task_id, db=session)


# # изменение статуса
# @router_roadmap_api.patch("/task_state_change/{project_id}/{task_id}", response_model=TaskStateSchemaR)
# async def task_state_change(request: Request, project_id: int, task_id: int, task_state: TaskStateSchema, session: AsyncSession = Depends(get_async_session)) -> TaskStateSchemaR:
#     return await task_state_change_service(request=request, project_id=project_id, task_id=task_id, task_state=task_state, db=session)


# # приглашение пользователя в проект
# # на фронте ищем пользователей по емейлу и даем список пользователей на фронте также. Напротив пользователя отобразить кнопку пригласить в проект. После приглашения в ассоциативной таблице появится запись, например, 32-й проект и пользователь 1, и вторая строка 32-й проект и пользователь 2. То есть в 32 проекте будет 2 пользака. 

# # поиск юзера при добавлении в проект. Тут поиск идет через параметр из ссылки
# @router_roadmap_api.get("/search_user/{project_id}", response_model=UsersSearchSchema)
# async def search_user(request: Request, project_id: int, email_user: EmailStr, session: AsyncSession = Depends(get_async_session)) -> UsersSearchSchema:
#     return await search_user_service(request=request, project_id=project_id, email_user=email_user, db=session)



# # добавление пользователя в проект
# @router_roadmap_api.post("/invite_to_project/")
# async def invite_to_project(request: Request, user_invite: User_invite_to_project_schema, session: AsyncSession = Depends(get_async_session)):
#     return await invite_to_project_service(request=request, user_invite=user_invite, db=session)


# # исключение из проекта
# @router_roadmap_api.delete("/exclude_from_project/")
# async def exclude_from_project(request: Request, data: User_invite_to_project_schema = Body(...), session: AsyncSession = Depends(get_async_session)):
#     return await exclude_from_project_service(request=request, user_exclude=data, db=session)


# # все пользователи проекта. 
# @router_roadmap_api.get("/all_current_users_project/{project_id}", response_model=list[User_in_project_schema])
# async def all_current_users_project(request: Request, project_id: int, session: AsyncSession = Depends(get_async_session)) -> User_in_project_schema:
#     return await all_current_users_project_service(request=request, project_id=project_id, db=session)


# # изменение роли пользователя
# @router_roadmap_api.patch("/role_project_change/", response_model=User_role_schema)
# async def role_project_change(request: Request, user_role: User_role_change_schema, session: AsyncSession = Depends(get_async_session)) -> User_role_schema:
#     return await role_project_change_service(request=request, user_role=user_role, db=session)



# # в react сделать хранение и проверку ролей через zustand, и на бэке сделать проверку ролей. В дипсик есть ответы почитать и сделать
# # смотреть дипсик, там сделал промт. Получается у нас всегда есть уязвимость если украли токен злоумышленник

# @router_roadmap_api.post("/create_project_token/")
# async def create_project_token(request: Request, project_id: User_project_role_schema, session: AsyncSession = Depends(get_async_session)):
#     return await create_project_token_service(request=request, project_id=project_id, db=session)



# # @router_roadmap_api.get("/update_project_token/")
# # async def update_project_token(request: Request, project_id: User_project_role_schema, session: AsyncSession = Depends(get_async_session)):
# #     return await create_project_token_service(request=request, project_id=project_id, db=session)


# # удаление проекта
# @router_roadmap_api.delete("/delete_project/")
# async def delete_project(request: Request, data: User_project_role_schema = Body(...), session: AsyncSession = Depends(get_async_session)):
#     return await delete_project_service(request=request, project_id=data.project_id, db=session)


# # удаление раздела в проекте
# @router_roadmap_api.delete("/delete_section/{project_id}/{section_id}")
# async def delete_section(request: Request, project_id: int, section_id: int, session: AsyncSession = Depends(get_async_session)):
#     return await delete_section_service(request=request, project_id=project_id, section_id=section_id, db=session)


