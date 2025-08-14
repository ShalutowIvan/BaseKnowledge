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

from routers_api.regusers.verify_user import verify_user_service
from .verify_role import verify_project_service




router_project_api = APIRouter(
    prefix="",
    tags=["Project_api"]
)


#запрос списка проектов
@router_project_api.get("/project_all/", response_model=list[ProjectsSchema])
async def projects_all(
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> ProjectsSchema:
    return await get_projects(user_id=user_id, db=session)


# создание проекта
@router_project_api.post("/project_create/", response_model=ProjectsSchema)
async def project_create(project: ProjectsCreateSchema, user_id: int = Depends(verify_user_service), session: AsyncSession = Depends(get_async_session)) -> ProjectsSchema:
    return await project_create_service(user_id=user_id, db=session, project=project)


# запрос проекта при открытии. Параметр project_id из url тянется в функцию verify_project_service из Depends
@router_project_api.get("/project_get/{project_id}", response_model=ProjectsSchema)
async def project_get_open(
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> ProjectsSchema:
    return await get_project_open(role_info=role_info, db=session)


# запрос секций в проекте
@router_project_api.get("/section_project_all/{project_id}", response_model=list[SectionsSchema])
async def section_project_all(
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> SectionsSchema:
    return await get_sections_project(role_info=role_info, db=session)


# изменение шапки проекта
@router_project_api.patch("/project_update_header/{project_id}", response_model=ProjectsCreateSchema)
async def project_update_header(    
    project_update: ProjectsCreateSchema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> ProjectsCreateSchema:    
    return await update_project_header_service(role_info=role_info, project_update=project_update, db=session)


# создание секции
@router_project_api.post("/section_create/{project_id}", response_model=SectionsSchema)
async def section_create(   
    section: SectionsCreateSchema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> SectionsSchema:
    return await section_create_service(role_info=role_info, db=session, section=section)


# изменение шапки секции
@router_project_api.patch("/section_update_header/{project_id}/{section_id}", response_model=SectionsCreateSchema)
async def section_update_header(
    section_id: int,
    section_update: SectionsCreateSchema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> SectionsCreateSchema:    
    return await update_section_header_service(role_info=role_info, section_id=section_id, section_update=section_update, db=session)


# запрос тасок в разделе
@router_project_api.get("/task_section_all/{project_id}/{section_id}", response_model=list[TasksSchema])
async def section_project_all(
    section_id: int, 
    role_info: tuple[int, int, str] = Depends(verify_project_service),     
    session: AsyncSession = Depends(get_async_session)) -> TasksSchema:
    return await get_tasks_section(role_info=role_info, section_id=section_id, db=session)



# запрос секции при открытой секции
@router_project_api.get("/section_get/{project_id}/{section_id}", response_model=SectionsSchema)
async def section_get_open(
    section_id: int, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> SectionsSchema:
    return await get_section_open(role_info=role_info, section_id=section_id, db=session)


# начала с этого роута по созданию задачи. Фронт пока не исправлял!!!!!!!!!!!!!! Сделал только создание задачи на фронте. Ост тут на фронте!!!!!

# создание задачи
@router_project_api.post("/task_create/{project_id}/{section_id}", response_model=TasksSchema)
async def task_create(
    section_id: int, 
    task: TaskCreateSchema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> TasksSchema:
    return await task_create_service(role_info=role_info, section_id=section_id, db=session, task=task)




# открыть задачу, тут фильтр по ID задачи. Возможно переделаю на UUID
@router_project_api.get("/task_open/{project_id}/{task_id}", response_model=TaskOpenSchema)
async def task_open(
    task_id: int, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> TaskOpenSchema:
    return await task_open_service(role_info=role_info, task_id=task_id, db=session)


#изменение задачи. Меняется только текст в контенте
@router_project_api.put("/task_update/{project_id}/{task_id}", response_model=TaskOpenSchema)
async def task_update(
    task_update: TaskUpdateSchema, 
    task_id: int, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)):    
    return await update_task_service(role_info=role_info, task_id=task_id, task_update=task_update, db=session)


# изменение шапки задачи
@router_project_api.patch("/task_update_header/{project_id}/{task_id}", response_model=TaskUpdateHeaderSchema)
async def task_update_header(
    task_id: int,
    task_update: TaskCreateSchema,
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> TaskUpdateHeaderSchema:
    return await update_task_header_service(role_info=role_info, task_id=task_id, task_update=task_update, db=session)


#удаление задачи
@router_project_api.delete("/delete_task/{project_id}/{task_id}")
async def delete_task(
    task_id: int, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_task_service(role_info=role_info, task_id=task_id, db=session)


# изменение статуса
@router_project_api.patch("/task_state_change/{project_id}/{task_id}", response_model=TaskStateSchemaR)
async def task_state_change(
    task_id: int, 
    task_state: TaskStateSchema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> TaskStateSchemaR:
    return await task_state_change_service(role_info=role_info, task_id=task_id, task_state=task_state, db=session)


# поиск юзера при добавлении в проект. Тут поиск идет через параметр из ссылки
@router_project_api.get("/search_user/{project_id}", response_model=UsersSearchSchema)
async def search_user(
    email_user: EmailStr, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)) -> UsersSearchSchema:
    return await search_user_service(role_info=role_info, email_user=email_user, db=session)


# добавление пользователя в проект
@router_project_api.post("/invite_to_project/{project_id}")
async def invite_to_project(
    user_invite: User_invite_to_project_schema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await invite_to_project_service(role_info=role_info, user_invite=user_invite, db=session)


# исключение из проекта
@router_project_api.delete("/exclude_from_project/{project_id}")
async def exclude_from_project(
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    data: User_invite_to_project_schema = Body(...), 
    session: AsyncSession = Depends(get_async_session)):
    return await exclude_from_project_service(role_info=role_info, user_exclude=data, db=session)


# все пользователи проекта. 
@router_project_api.get("/all_current_users_project/{project_id}", response_model=list[User_in_project_schema])
async def all_current_users_project(
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> User_in_project_schema:
    return await all_current_users_project_service(role_info=role_info, db=session)


# изменение роли пользователя
@router_project_api.patch("/role_project_change/{project_id}", response_model=User_role_schema)
async def role_project_change(
    user_role: User_role_change_schema, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> User_role_schema:
    return await role_project_change_service(role_info=role_info, user_role=user_role, db=session)



# @router_project_api.get("/update_project_token/")
# async def update_project_token(request: Request, project_id: User_project_role_schema, session: AsyncSession = Depends(get_async_session)):
#     return await create_project_token_service(request=request, project_id=project_id, db=session)


# удаление проекта
@router_project_api.delete("/delete_project/{project_id}")
async def delete_project(
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    # data: User_project_role_schema = Body(...), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_project_service(role_info=role_info, db=session)


# удаление раздела в проекте
@router_project_api.delete("/delete_section/{project_id}/{section_id}")
async def delete_section(
    section_id: int, 
    role_info: tuple[int, int, str] = Depends(verify_project_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_section_service(role_info=role_info, section_id=section_id, db=session)


# роут для получения токена роли для проектов
@router_project_api.post("/create_project_token/")
async def create_project_token(
    project_id: User_project_role_schema, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await create_project_token_service(user_id=user_id, project_id=project_id, db=session)




