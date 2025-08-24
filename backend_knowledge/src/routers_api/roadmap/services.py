from fastapi import HTTPException, Request, UploadFile, File, Body, status, Header
from fastapi.responses import FileResponse
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload, joinedload, load_only
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from .models import *
from .schemas import *
# from .verify_role import parse_role_service, verify_project_service

import os
import uuid
import aiofiles
import re
from transliterate import translit

from routers_api.regusers.verify_user import verify_user_service
from routers_api.regusers.models import User
import jwt #это PyJWT
# from settings import PROJECT_KEY, EXPIRE_TIME_PROJECT_TOKEN, ALG
from db_api.database import logger


# получение всех мапов, пока без пагинации
async def get_roadmaps_service(db: AsyncSession, user_id: int = None) -> list[RoadmapsSchema]:    

    query = (
        select(RoadMap)
        .where(RoadMap.user_id == user_id)        
        .order_by(RoadMap.created_at.desc())
    )

    result = await db.execute(query)
    roadmaps = result.scalars().all()
    
    return roadmaps
    

async def roadmap_create_service(
    user_id: int, 
    db: AsyncSession, 
    roadmap: RoadmapsCreateSchema) -> RoadmapsSchema:    
    
    new_roadmap = RoadMap(title=roadmap.title, description=roadmap.description, user_id=user_id)
    
    db.add(new_roadmap)
    await db.commit()
    await db.refresh(new_roadmap)
    return new_roadmap


async def roadmap_get_open_service(roadmap_id: int, user_id: int, db: AsyncSession) -> RoadmapsSchema:    
    # try:
    query = select(RoadMap).where(RoadMap.id == roadmap_id).where(RoadMap.user_id == user_id)
    result = await db.execute(query)
    roadmap = result.scalar_one_or_none()
    if roadmap == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road map not found!")            
    return roadmap
    # except Exception as ex:        
    #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error search roadmap!")


# запрос секций в мапе
async def chapters_all_roadmap_service(roadmap_id: int, user_id: int, db: AsyncSession) -> ChaptersSchema:
    try:
        query = select(Chapter).where(Chapter.roadmap_id == roadmap_id).where(Chapter.user_id == user_id)
        chapters = await db.execute(query)
        return chapters.scalars().all()
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error search Chapter!")

    
# измененние шапки. 
async def update_roadmap_header_service(roadmap_id: int, user_id: int, roadmap_update: RoadmapsCreateSchema, db: AsyncSession):    
    try:    
        # 1. Получаем текущий мап
        query = select(RoadMap).where(RoadMap.id == roadmap_id).where(RoadMap.user_id == user_id)
            
        result = await db.execute(query)
        roadmap_header = result.scalar_one_or_none()
            
        if not roadmap_header:
            raise HTTPException(status_code=404, detail="roadmap not found")
        
        # 2. Обновляем мап
        roadmap_header.title = roadmap_update.title
        roadmap_header.description = roadmap_update.description
        
        await db.commit()
        await db.refresh(roadmap_header)
            
        return roadmap_header
    except Exception as ex:
        # print("ошибка при изменении шапки роадмапы:", ex)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Error whis change config roadmap")


async def chapter_create_service(roadmap_id: int, user_id: int, chapter: ChaptersCreateSchema, db: AsyncSession) -> ChaptersSchema:
    
    try:
        # Проверяем, существует ли roadmap и принадлежит ли пользователю
        query = select(RoadMap).where(RoadMap.id == roadmap_id, RoadMap.user_id == user_id)
        result = await db.execute(query)
        roadmap = result.scalar_one_or_none()
        
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="RoadMap not found or you don't have permission to add chapters to it"
            )


        new_chapter = Chapter(title=chapter.title, description=chapter.description, roadmap_id=roadmap_id, user_id=user_id)
        db.add(new_chapter)
        await db.commit()
        await db.refresh(new_chapter)
        return new_chapter
    except Exception as ex:        
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")



async def chapter_update_header_service(user_id: int, chapter_id: int, chapter_update: ChaptersCreateSchema, db: AsyncSession):
    try:
        # 1. Получаем текущий чаптер
        query = select(Chapter).where(Chapter.id == chapter_id).where(Chapter.user_id == user_id)            
        result = await db.execute(query)
        chapter_header = result.scalar()
            
        if not chapter_header:
            raise HTTPException(status_code=404, detail="chapter not found")
        
        # 2. Обновляем чаптер
        chapter_header.title = chapter_update.title
        chapter_header.description = chapter_update.description
        
        await db.commit()
        await db.refresh(chapter_header)
            
        return chapter_header
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")


async def stage_chapter_all_service(user_id: int, chapter_id: int, db: AsyncSession) -> StageSchema:    
    try:
        query = select(Stage).where(Stage.chapter_id == chapter_id).where(Stage.user_id == user_id).order_by(Stage.created_at.desc())
        stages = await db.execute(query)
        return stages.scalars().all()
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")
        


async def chapter_get_open_service(user_id: int, chapter_id: int, db: AsyncSession) -> ChaptersSchema:    
    try:
        query = select(Chapter).where(Chapter.id == chapter_id).where(Chapter.user_id == user_id)
        chapter = await db.execute(query)
        return chapter.scalar()
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")


async def stage_create_service(user_id: int, chapter_id: int, db: AsyncSession, stage: StageCreateSchema) -> StageSchema:
    try:
        query = select(Chapter).where(Chapter.id == chapter_id, Chapter.user_id == user_id)
        result = await db.execute(query)
        chapter = result.scalar_one_or_none()        
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="chapter not found or you don't have permission to add stages to it"
            )

        slug = translit(stage.title, language_code='ru', reversed=True)    
        new_stage = Stage(title=stage.title, description=stage.description, chapter_id=chapter_id, slug=slug, user_id=user_id)
        db.add(new_stage)
        await db.commit()
        await db.refresh(new_stage)
        return new_stage
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")
        


# # открыть задачу
async def stage_open_service(user_id: int, stage_id: int, db: AsyncSession):
    try:
        query = select(Stage).where(Stage.id == stage_id).where(Stage.user_id == user_id)    
        stage = await db.execute(query)        
        return stage.scalar()
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")


async def stage_update_service(user_id: int, stage_id: int, stage_update: StageUpdateSchema, db: AsyncSession):
    
    try:
        # 1. Получаем текущую задачу.
        query = await db.execute(select(Stage).where(Stage.id == stage_id).where(Stage.user_id == user_id))
        db_stage = query.scalar()
        if not db_stage:
            raise HTTPException(status_code=404, detail="stage not found")
        
        # 2. Обновляем задачу
        db_stage.updated_at = datetime.utcnow()    
        db_stage.content = stage_update.content
        await db.commit()
        await db.refresh(db_stage)
        
        return db_stage
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")



# # обновление шапки таски, переделать под таску
async def stage_update_header_service(user_id: int, stage_id: int, stage_update: StageChangeHeaderSchema, db: AsyncSession):    
    try:
        # 1. Получаем текущую таску 4-мя полями. А с фронта принимаем 3 поля. И возвращаем ответ
        query = select(Stage).where(Stage.id == stage_id).where(Stage.user_id == user_id).options(
                    load_only(
                    Stage.title,
                    Stage.description,
                    Stage.updated_at,
                    Stage.state
                    )
                )
        result = await db.execute(query)
        stage_header = result.scalar_one_or_none()

        if not stage_header:            
            # logger.warning(f"Stage not found - user_id: {user_id}, stage_id: {stage_id}")
            raise HTTPException(status_code=404, detail="stage not found")
        
        # # 2. Обновляем этап
        stage_header.title = stage_update.title
        stage_header.description = stage_update.description
        stage_header.state = stage_update.state
        stage_header.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(stage_header)
        
        logger.info(f"Stage updated successfully - user_id: {user_id}, stage_id: {stage_id}")
        # возвращаем все 3 поля.
        return stage_header


    # except HTTPException as ex:        
    #     # HTTPException которые мы сами подняли - уже залогированы
    #     # Просто передаем дальше без изменений
    #     raise ex

    except Exception as ex:
        # Правильное логирование ошибки
        # logger.error(
        #     f"Error in stage_update_header_service, user_id: {user_id}, stage_id: {stage_id}",            
        #     # exc_info=True  # Это добавит полный traceback к логу
        # )

        # import traceback
        # import inspect
        # stack = traceback.format_stack()
        # calling_function = stack[-2].split('\n')[0].strip() if len(stack) > 1 else "unknown"
        
        # logger.error(
        #     f"Error in {inspect.currentframe().f_code.co_name}, "
        #     f"called from: {calling_function}, "
        #     f"user_id: {user_id}, stage_id: {stage_id}",
        #     exc_info=True
        # )

        # raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Ошибка: {ex}")
        raise ex



async def delete_stage_service(user_id: int, stage_id: int, db: AsyncSession) -> bool:    
    
    try:
        # 1. Получаем задачу        
        query = select(Stage).where(Stage.id == stage_id).where(Stage.user_id == user_id)
        result = await db.execute(query)
        db_stage = result.scalar()
        if not db_stage:
            return False

        # 2. Удаляем задачу. 
        await db.delete(db_stage)
        
        await db.commit()
        return True

    except Exception as ex:
        
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Ошибка при удалении этапа: {str(e)}"
        )



async def stage_state_change_service(user_id: int, stage_id: int, stage_state: StageStateSchema, db: AsyncSession):
    
    try:
        # 1. Получаем текущую таску 2-мя полями. С фронта принимаем 2 поля. И возвращаем ответ
        query = select(Stage).where(Stage.id == stage_id).where(Stage.user_id == user_id).options(
                    load_only(
                    Stage.state,
                    Stage.updated_at
                    )
                )
        result = await db.execute(query)
        stage = result.scalar_one_or_none()

        if not stage:
            raise HTTPException(status_code=404, detail="stage not found")
        
        # # 2. Обновляем задачу    
        stage.state = stage_state.state
        stage.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(stage)
        
        # возвращаем 2 поля.
        return stage
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")


async def delete_roadmap_service(user_id: int, roadmap_id: int, db: AsyncSession) -> bool:
    
    try:
        # удаляем роадмап
        query = select(RoadMap).where(RoadMap.id == roadmap_id).where(RoadMap.user_id == user_id)
        result = await db.execute(query)
        db_roadmap = result.scalar()
        if not db_roadmap:
            return False
        
        await db.delete(db_roadmap)
        
        await db.commit()
        return True

    except Exception as ex:        
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Ошибка при удалении мапы: {str(ex)}")
    

async def delete_chapter_service(user_id: int, chapter_id: int, db: AsyncSession) -> bool:

    try:
        query = select(Chapter).where(Chapter.id == chapter_id).where(Chapter.user_id == user_id)
        result = await db.execute(query)
        db_chapter = result.scalar()
        if not db_chapter:
            return False
        
        await db.delete(db_chapter)
        
        await db.commit()
        return True

    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Ошибка при удалении главы: {str(ex)}")



