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
async def roadmaps_all(
    user_id: int = Depends(verify_user_service),
    session: AsyncSession = Depends(get_async_session)) -> RoadmapsSchema:
    return await get_roadmaps_service(user_id=user_id, db=session)


# создание мапы
@router_roadmap_api.post("/roadmap_create/", response_model=RoadmapsSchema)
async def project_create(roadmap: RoadmapsCreateSchema, user_id: int = Depends(verify_user_service), session: AsyncSession = Depends(get_async_session)) -> RoadmapsSchema:
    return await roadmap_create_service(user_id=user_id, db=session, roadmap=roadmap)


# запрос мапы при открытии.
@router_roadmap_api.get("/roadmap_get/{roadmap_id}", response_model=RoadmapsSchema)
async def roadmap_get_open(
    roadmap_id: int,
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> RoadmapsSchema:
    return await roadmap_get_open_service(roadmap_id=roadmap_id, user_id=user_id, db=session)


# запрос чаптеров в мапе
@router_roadmap_api.get("/chapters_roadmap_all/{roadmap_id}", response_model=list[ChaptersSchema])
async def chapters_roadmap_all(
    roadmap_id: int,
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> ChaptersSchema:
    return await chapters_all_roadmap_service(roadmap_id=roadmap_id, user_id=user_id, db=session)


# # изменение шапки мапы
@router_roadmap_api.patch("/roadmap_update_header/{roadmap_id}", response_model=RoadmapsCreateSchema)
async def roadmap_update_header(
    roadmap_update: RoadmapsCreateSchema, 
    roadmap_id: int,
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> RoadmapsCreateSchema:    
    return await update_roadmap_header_service(roadmap_id=roadmap_id, user_id=user_id, roadmap_update=roadmap_update, db=session)


# # создание чаптеров. Можно создать чаптер в чужой роадмапе. При этом владелец роадмапы ее не увидит. И пользак который создал чаптер в чужой роадмапе через фронт не увидит, а через отдельный запрос с бэка увидит
# любой пользак в любой дорожной карте может создать чаптер. Плохо... Самое просто сделать запрос принадлежности роадмапе, но это +1 SQL...
@router_roadmap_api.post("/chapter_create/{roadmap_id}", response_model=ChaptersSchema)
async def chapter_create(
    roadmap_id: int,
    chapter: ChaptersCreateSchema, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> ChaptersSchema:
    return await chapter_create_service(roadmap_id=roadmap_id, user_id=user_id, chapter=chapter, db=session)


# # изменение шапки секции
@router_roadmap_api.patch("/chapter_update_header/{chapter_id}", response_model=ChaptersCreateSchema)
async def chapter_update_header(
    chapter_id: int,
    chapter_update: ChaptersCreateSchema, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> ChaptersCreateSchema:    
    return await chapter_update_header_service(user_id=user_id, chapter_id=chapter_id, chapter_update=chapter_update, db=session)


# # запрос стейджей в разделе
@router_roadmap_api.get("/stage_chapter_all/{chapter_id}", response_model=list[StageSchema])
async def stage_chapter_all(
    chapter_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> StageSchema:
    return await stage_chapter_all_service(user_id=user_id, chapter_id=chapter_id, db=session)


# # запрос секции при открытой секции
@router_roadmap_api.get("/chapter_get/{chapter_id}", response_model=ChaptersSchema)
async def chapter_get_open(
    chapter_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> ChaptersSchema:
    return await chapter_get_open_service(user_id=user_id, chapter_id=chapter_id, db=session)


# # создание задачи
@router_roadmap_api.post("/stage_create/{chapter_id}", response_model=StageSchema)
async def stage_create(
    chapter_id: int, 
    stage: StageCreateSchema, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> StageSchema:
    return await stage_create_service(user_id=user_id, chapter_id=chapter_id, db=session, stage=stage)


# # открыть задачу, тут фильтр по ID задачи. Возможно переделаю на UUID
@router_roadmap_api.get("/stage_open/{stage_id}", response_model=StageOpenSchema)
async def stage_open(
    stage_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)
    ) -> StageOpenSchema:
    return await stage_open_service(user_id=user_id, stage_id=stage_id, db=session)


# #изменение задачи. Меняется только текст в контенте. Подумать, зачем возвращать полную схему когда меняем только контент...
@router_roadmap_api.put("/stage_update/{stage_id}", response_model=StageOpenSchema)
async def stage_update(
    stage_update: StageUpdateSchema, 
    stage_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):    
    return await stage_update_service(user_id=user_id, stage_id=stage_id, stage_update=stage_update, db=session)


# # изменение шапки задачи
@router_roadmap_api.patch("/stage_update_header/{stage_id}", response_model=StageUpdateHeaderSchema)
async def stage_update_header(
    stage_id: int,
    stage_update: StageChangeHeaderSchema,
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> StageUpdateHeaderSchema:
    return await stage_update_header_service(user_id=user_id, stage_id=stage_id, stage_update=stage_update, db=session)


# #удаление задачи
@router_roadmap_api.delete("/delete_stage/{stage_id}")
async def delete_stage(
    stage_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_stage_service(user_id=user_id, stage_id=stage_id, db=session)


# # изменение статуса
@router_roadmap_api.patch("/stage_state_change/{stage_id}", response_model=StageStateSchemaR)
async def stage_state_change(
    stage_id: int, 
    stage_state: StageStateSchema, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)) -> StageStateSchemaR:
    return await stage_state_change_service(user_id=user_id, stage_id=stage_id, stage_state=stage_state, db=session)


# удаление роадмапы
@router_roadmap_api.delete("/delete_roadmap/{roadmap_id}")
async def delete_roadmap(
    roadmap_id: int,
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_roadmap_service(user_id=user_id, roadmap_id=roadmap_id, db=session)


# удаление раздела в мапе
@router_roadmap_api.delete("/delete_chapter/{chapter_id}")
async def delete_chapter(
    chapter_id: int, 
    user_id: int = Depends(verify_user_service), 
    session: AsyncSession = Depends(get_async_session)):
    return await delete_chapter_service(user_id=user_id, chapter_id=chapter_id, db=session)



