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



# получение всех мапов, пока без пагинации
async def get_roadmaps(db: AsyncSession, user_id: int = None) -> list[RoadmapsSchema]:    

    query = (
        select(RoadMap)  # Выбираем проекты        
        # Фильтруем только записи, где user_id совпадает с ID текущего пользователя
        .where(RoadMap.user_id == user_id)
        # Сортируем по дате создания (новые сверху)
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
    try:
        query = select(RoadMap).where(RoadMap.id == roadmap_id).where(RoadMap.user_id == user_id)
        result = await db.execute(query)
        roadmap = result.scalar_one_or_none()
        if roadmap == None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road map not found!")            
        return roadmap
    except Exception as ex:        
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error search roadmap!")


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
        query = select(Stage).where(Stage.chapter_id == chapter_id).where(Stage.user_id == user_id)
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


async def task_create_service(user_id: int, chapter_id: int, db: AsyncSession, stage: StageCreateSchema) -> StageSchema:
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
        new_stage = Stage(title=stage.title, description=stage.description, chapter_id=chapter_id, slug=slug)
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
        query = await db.execute(select(Stage).where(Stage.id == stage_id)).where(Stage.user_id == user_id)   
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
async def stage_update_header_service(user_id: int, stage_id: int, stage_update: StageCreateSchema, db: AsyncSession):    
    try:
        # 1. Получаем текущую таску 3-мя полями. А с фронта принимаем 2 поля. И возвращаем ответ
        query = select(Stage).where(Stage.id == stage_id).where(Stage.user_id == user_id).options(
                    load_only(
                    Stage.title,
                    Stage.description,
                    Stage.updated_at                
                    )
                )
        result = await db.execute(query)
        stage_header = query.scalar_one_or_none()

        if not stage_header:
            raise HTTPException(status_code=404, detail="task not found")
        
        # # 2. Обновляем задачу
        stage_header.title = stage_update.title
        stage_header.description = stage_update.description
        stage_header.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(stage_header)
        
        # возвращаем все 3 поля.
        return stage_header
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{ex}")



# async def delete_task_service(role_info: tuple, db: AsyncSession, task_id: int) -> bool:
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=project_id)

#     if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):

#         try:
#             # 1. Получаем задачу
#             query = await db.execute(select(Task).where(Task.id == task_id))    
#             db_task = query.scalar()
#             if not db_task:
#                 return False

#             # 2. Удаляем задачу. 
#             await db.delete(db_task)
            
#             await db.commit()
#             return True

#         except Exception as ex:
#             print("Ошибка при удалении задачи:", ex)
#             raise HTTPException(
#                 status_code=500,
#                 detail=f"Ошибка при удалении задачи: {str(e)}"
#             )
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


# async def task_state_change_service(role_info: tuple, task_id: int, task_state: TaskStateSchema, db: AsyncSession):
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=project_id)

#     if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):
#         # 1. Получаем текущую таску 3-мя полями. А с фронта принимаем 2 поля. И возвращаем ответ
#         query = await db.execute(select(Task).where(Task.id == task_id).options(
#                     load_only(
#                     Task.state,
#                     Task.updated_at
#                     )
#                 ))    
#         task = query.scalar_one_or_none()

#         if not task:
#             raise HTTPException(status_code=404, detail="task not found")
        
#         # # 2. Обновляем задачу    
#         task.state = task_state.state
#         task.updated_at = datetime.utcnow()
#         await db.commit()
#         await db.refresh(task)
        
#         # возвращаем 2 поля.
#         return task
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})



# async def search_user_service(role_info: tuple, email_user: EmailStr, db: AsyncSession):
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=project_id)

#     if role_info[2] == Role.ADMIN.value:
#         try:
#             query = await db.execute(select(User).where(User.email == email_user).options(
#                     load_only(
#                     User.name,
#                     User.email,
#                     User.id
#                     )
#                 ))
#             db_user = query.scalar()
#             # print("!!!!!!!!!!!!!!!!!!")
#             # print(db_user)
#             if db_user == None:
#                 # raise HTTPException(status_code=400, detail=f"Ошибка при поиске пользователя: {str(ex)}")
#                 raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

#             query_user_project = await db.execute(
#                     (select(ProjectUserAssociation)
#                     .where(ProjectUserAssociation.user_id == db_user.id)
#                     .where(ProjectUserAssociation.project_id == role_info[0])
#                     ))
#             user_project = query_user_project.scalar_one_or_none()
#             if user_project == None:
#                 invite = True
#             elif user_project != None:
#                 invite = False

#             return {"user": db_user, "invite": invite}
#         except Exception as ex:            
#             raise HTTPException(status_code=400, detail=f"Ошибка при поиске пользователя: {str(ex)}")

#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


# async def invite_to_project_service(role_info: tuple, user_invite: User_invite_to_project_schema, db: AsyncSession):
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=user_invite.project_id)

#     if role_info[2] == Role.ADMIN.value:
#         try:
#             # запросили пользователя
#             query_user = await db.execute(select(User).where(User.id == user_invite.user_id))    
#             db_user = query_user.scalar()
#             # запросили проект
#             query_project = await db.execute(select(Project).where(Project.id == role_info[0]))    
#             db_project = query_project.scalar()
#             # создали связь пользователя с проектом с ролью гость
#             association = db_project.add_user(db_user)
#             db.add(association)
#             await db.commit()
#             await db.refresh(association)

#             return {"Ответ": "Все отлично!"}
#         except Exception as ex:
#             print("Ошибка при добавлении пользователя в проект ниже!!!")
#             print(ex)
#             raise HTTPException(status_code=400, detail=f"Ошибка при добавлении пользователя в проект: {str(ex)}")
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


# async def exclude_from_project_service(role_info: tuple, user_exclude: User_invite_to_project_schema, db: AsyncSession):

#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=user_exclude.project_id)

#     if role_info[2] == Role.ADMIN.value:

#         try:
#             # current_user_id = await verify_user_service(request=request)

#             # query_current_user = await db.execute(select(User).where(User.id == current_user_id))
#             # current_user = query_current_user.scalar()
#             # тут проверяем токены пользака из токена и токен которого удаляем
#             if role_info[1] == user_exclude.user_id:
#                 return {"answer": "Нельзя удалить себя!"}


#             query_user_project = await db.execute(
#                     (select(ProjectUserAssociation)
#                     .where(ProjectUserAssociation.user_id == user_exclude.user_id)
#                     .where(ProjectUserAssociation.project_id == role_info[0])
#                     ))
#             user_project = query_user_project.scalar_one_or_none()
            
#             await db.delete(user_project)
            
#             await db.commit()
#             return True        
#         except Exception as ex:
#             print("Ошибка при удалении пользователя из проекта ниже!!!")
#             print(ex)
#             raise HTTPException(status_code=400, detail=f"Ошибка при исключении пользователя из проекта: {str(ex)}")
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


# async def all_current_users_project_service(role_info: tuple, db: AsyncSession):
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=project_id)

#     if role_info[2] == Role.ADMIN.value:
#         try:
#             query = (
#                 select(User.name, User.email, User.id, ProjectUserAssociation.role)
#                 .join(ProjectUserAssociation, User.id == ProjectUserAssociation.user_id)
#                 .where(ProjectUserAssociation.project_id == role_info[0])
#             )
#             users_project = await db.execute(query)        
#             return users_project        
#         except Exception as ex:
#             print("Ошибка валидации!!!!!!!!!!!!!")
#             print(ex)
#             raise HTTPException(status_code=400, detail=f"Ошибка при запросе пользователей: {str(ex)}")
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})
    

# async def role_project_change_service(role_info: tuple, user_role: User_role_change_schema, db: AsyncSession):
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=user_role.project_id)

#     if role_info[2] == Role.ADMIN.value:
    
#         # 1. Получаем текущую таску 3-мя полями. А с фронта принимаем 2 поля. И возвращаем ответ
#         query_user_project = await db.execute(
#                     (select(ProjectUserAssociation)
#                     .where(ProjectUserAssociation.user_id == user_role.user_id)
#                     .where(ProjectUserAssociation.project_id == role_info[0])
#                     ))
#         user_project = query_user_project.scalar_one_or_none()

#         if not user_project:
#             raise HTTPException(status_code=404, detail="task not found")
        
#         # 2. Обновляем роль
#         user_project.role = user_role.role    
#         await db.commit()
#         await db.refresh(user_project)
        
#         # возвращаем роль.
#         return user_project
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role[2]} - is not suitable for this action"})


# # ост тут
# async def delete_project_service(role_info: tuple, db: AsyncSession) -> bool:
#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=project_id)

#     if role_info[2] == Role.ADMIN.value:
#         try:
#             # удаляем связь проекта из таблицы ассоциаций
#             await db.execute(
#                 delete(ProjectUserAssociation).where(ProjectUserAssociation.project_id == role_info[0])
#             )
#             await db.commit()

#             # удаляем сам проект
#             query = await db.execute(select(Project).where(Project.id == role_info[0]))    
#             db_project = query.scalar()
#             if not db_project:
#                 return False

#             # 2. Удаляем проект. 
#             await db.delete(db_project)
            
#             await db.commit()
#             return True

#         except Exception as ex:
#             print("Ошибка при удалении проекта:", ex)
#             raise HTTPException(
#                 status_code=500,
#                 detail=f"Ошибка при удалении проекта: {str(ex)}"
#             )
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


# async def delete_section_service(role_info: tuple, section_id: int, db: AsyncSession) -> bool:

#     # role = await parse_role_service(request=request)
#     # verify = await verify_project_service(role=role, project_id=project_id)

#     if role_info[2] == Role.ADMIN.value:
#         try:
#             query = await db.execute(select(Section).where(Section.id == section_id))
#             db_section = query.scalar()
#             if not db_section:
#                 return False

#             # 2. Удаляем проект. 
#             await db.delete(db_section)
            
#             await db.commit()
#             return True

#         except Exception as ex:
#             print("Ошибка при удалении секции:", ex)
#             raise HTTPException(
#                 status_code=500,
#                 detail=f"Ошибка при удалении секции: {str(ex)}"
#             )
#     else:
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})



# # создание токена с ролью для проекта
# async def create_project_token_service(user_id: int, project_id: User_project_role_schema, db: AsyncSession, expires_delta: timedelta | None = None):

#     # current_user_id = await verify_user_service(request=request)

#     # if not current_user_id:
#     #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="401_UNAUTHORIZED")

#     query_user_project = await db.execute(
#                 (select(ProjectUserAssociation)
#                 .where(ProjectUserAssociation.user_id == user_id)
#                 .where(ProjectUserAssociation.project_id == project_id.project_id)
#                 ))
#     user_project = query_user_project.scalar_one_or_none()
#     if not user_project:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "access_denied", "message": "User is not a member of this project"})    
    
#     data = {"project_id": user_project.project_id , "user_id": user_project.user_id, "role": user_project.role.value}

#     to_encode = data.copy()
#     if expires_delta:#если задано время истекания токена, то к текущему времени мы добавляем время истекания
#         expire = datetime.utcnow() + expires_delta
#     #expires_delta это если делать какую-то
#     else:#иначе задаем время истекания также 30 мин
#         expire = datetime.utcnow() + timedelta(minutes=int(EXPIRE_TIME_PROJECT_TOKEN))#протестить длительность токена с 0 минут
#     to_encode.update({"exp": expire})#тут мы добавили элемент в словарь который скопировали выше элемент с ключом "exp" и значением времени, которое сделали строкой выше. 
#     encoded_jwt = jwt.encode(to_encode, PROJECT_KEY, algorithm=ALG)#тут мы кодируем наш токен.
#     return {"Project_token": encoded_jwt}
