from fastapi import HTTPException, Request, UploadFile, File, Body, status
from fastapi.responses import FileResponse
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload, joinedload, load_only
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from .models import *
from .schemas import *
from .verify_role import parse_role_service, verify_project_service

import os
import uuid
import aiofiles
import re
from transliterate import translit

from routers_api.regusers.verify_user import verify_user_service
from routers_api.regusers.models import User
import jwt #это PyJWT
from settings import PROJECT_KEY, EXPIRE_TIME_PROJECT_TOKEN, ALG


# для проектов
############################################################


# получение всех проектов, пока без пагинации
async def get_projects(user_id: int, db: AsyncSession) -> list[ProjectsSchema]:

    # user_id = await verify_user_service(request=request)

    # if not user_id:        
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="401_UNAUTHORIZED")

    stmt = (
        select(Project)  # Выбираем проекты        
        # Присоединяем ассоциативную таблицу (Project -> ProjectUserAssociation)
        .join(Project.users)
        # Фильтруем только записи, где user_id совпадает с ID текущего пользователя
        .where(ProjectUserAssociation.user_id == user_id)
        # Сортируем по дате создания (новые сверху)
        .order_by(Project.created_at.desc())
    )

    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    return projects
    


async def project_create_service(user_id: int, db: AsyncSession, project: ProjectsCreateSchema) -> ProjectsSchema:
    # Создаем новый проект. Создание проекта идет через метод из объекта пользователя, именно его юзаем для создания проекта
    # ищем пользователя по токену
    # user_id = await verify_user_service(request=request)

    # if not user_id:
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="401_UNAUTHORIZED")

    query = await db.execute(select(User).where(User.id == user_id))
    user = query.scalar()
    # print(dir(user))#в объекте user есть метод create_project, его можно юзать тут. То есть мы авторизовались, взяли пользака и юзаем метод из него для создания проекта. Но надо это тестировать...
    
    new_project = user.create_project(title=project.title, description=project.description)
    
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


async def get_project_open(role_info: tuple, db: AsyncSession) -> ProjectsSchema:
    # role = await parse_role_service(request=request)#проверка клиент токена и дешифровка роли
    # verify = await verify_project_service(role=role, project_id=project_id)#проверка принадлежности проекту из токена. Там если что выдается exception. 

    user_id = role_info[1]
    project_id = role_info[0]

    # user_id = await verify_user_service(request=request)

    # if not user_id:
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="401_UNAUTHORIZED")

    stmt = (
        select(Project)  # Выбираем проекты        
        # Присоединяем ассоциативную таблицу (Project -> ProjectUserAssociation)
        .join(Project.users)
        # Фильтруем только записи, где user_id совпадает с ID текущего пользователя
        .where(ProjectUserAssociation.project_id == project_id)
        .where(ProjectUserAssociation.user_id == user_id)        
    )

    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if project == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "access_denied", "message": "User is not a member of this project"})

        # return "Все плохо тут прописать httpexception с детаил и тд ост тут.....!!! и сразу при запросе проекта будет ошибка с бэка если пользака нет в проекте и в реакт сделать логику..."
    # return project.scalars().first()
    return project


async def get_sections_project(role_info: tuple, db: AsyncSession) -> SectionsSchema:
    # role = await parse_role_service(request=request)#проверка клиент токена и дешифровка роли
    # verify = await verify_project_service(role=role, project_id=project_id)#проверка принадлежности проекту из токена
    project_id = role_info[0]

    if (role_info[2] != Role.GUEST.value):
        sections = await db.execute(select(Section).where(Section.project_id == project_id))    
        return sections.scalars().all()
    else:
        print("ошибка тут!!!!!!!!!!!!!!")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role {role} is not suitable for this action"})

    
# измененние шапки. project_id тут не query параметр, а параметр из ссылки роута. В реакт интерцепторе тоже есть query параметр project_id используемый для обновления Project_token, но он потом удаляется и не передается
async def update_project_header_service(role_info: tuple, project_update: ProjectsCreateSchema, db: AsyncSession):    
    # 0. Проверка роли
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):    
        # 1. Получаем текущий проект
        query = select(Project).where(Project.id == role_info[0])
            
        result = await db.execute(query)
        project_header = result.scalar()
            
        if not project_header:
            raise HTTPException(status_code=404, detail="project not found")
        
        # 2. Обновляем проект
        project_header.title = project_update.title
        project_header.description = project_update.description
        
        await db.commit()
        await db.refresh(project_header)
            
        return project_header
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def section_create_service(role_info: tuple, db: AsyncSession, section: SectionsCreateSchema) -> SectionsSchema:
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):
        new_section = Section(title=section.title, description=section.description, project_id=role_info[0])    
        db.add(new_section)
        await db.commit()
        await db.refresh(new_section)
        return new_section        
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def update_section_header_service(role_info: tuple, section_id: int, section_update: SectionsCreateSchema, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):

        # 1. Получаем текущий проект
        query = select(Section).where(Section.id == section_id)
            
        result = await db.execute(query)
        section_header = result.scalar()
            
        if not section_header:
            raise HTTPException(status_code=404, detail="section not found")
        
        # 2. Обновляем проект
        section_header.title = section_update.title
        section_header.description = section_update.description
        
        await db.commit()
        await db.refresh(section_header)
            
        return section_header
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def get_tasks_section(role_info: tuple, section_id: int, db: AsyncSession) -> TasksSchema:
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] != Role.GUEST.value):
        tasks = await db.execute(select(Task).where(Task.section_id == section_id))    
        return tasks.scalars().all()
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та при запросе секции")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def get_section_open(role_info: tuple, section_id: int, db: AsyncSession) -> SectionsSchema:
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] != Role.GUEST.value):
        section = await db.execute(select(Section).where(Section.id == section_id))    
        return section.scalars().first()
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та при запросе таски")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def task_create_service(role_info: tuple, section_id: int, db: AsyncSession, task: TaskCreateSchema) -> TasksSchema:

    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):

        slug = translit(task.title, language_code='ru', reversed=True)    
        new_task = Task(title=task.title, description=task.description, section_id=section_id, slug=slug)
        db.add(new_task)
        await db.commit()
        await db.refresh(new_task)
        return new_task
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


# открыть задачу
async def task_open_service(role_info: tuple, task_id: int, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id) 

    if (role_info[2] != Role.GUEST.value):
        query = select(Task).where(Task.id == task_id)    
        task = await db.execute(query)        
        return task.scalar()
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та при запросе таски")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def update_task_service(role_info: tuple, task_id: int, task_update: TaskUpdateSchema, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):

        # 1. Получаем текущую задачу.
        query = await db.execute(select(Task).where(Task.id == task_id))    
        db_task = query.scalar()
        if not db_task:
            raise HTTPException(status_code=404, detail="task not found")
        
        # 2. Обновляем задачу
        db_task.updated_at = datetime.utcnow()    
        db_task.content = task_update.content
        await db.commit()
        await db.refresh(db_task)
        
        return db_task
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})



# обновление шапки таски, переделать под таску
async def update_task_header_service(role_info: tuple, task_id: int, task_update: TaskCreateSchema, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):
        # 1. Получаем текущую таску 3-мя полями. А с фронта принимаем 2 поля. И возвращаем ответ
        query = await db.execute(select(Task).where(Task.id == task_id).options(
                    load_only(
                    Task.title,
                    Task.description,
                    Task.updated_at                
                    )
                ))    
        task_header = query.scalar_one_or_none()

        if not task_header:
            raise HTTPException(status_code=404, detail="task not found")
        
        # # 2. Обновляем задачу
        task_header.title = task_update.title
        task_header.description = task_update.description
        task_header.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(task_header)
        
        # возвращаем все 3 поля.
        return task_header
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})



async def delete_task_service(role_info: tuple, db: AsyncSession, task_id: int) -> bool:
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):

        try:
            # 1. Получаем задачу
            query = await db.execute(select(Task).where(Task.id == task_id))    
            db_task = query.scalar()
            if not db_task:
                return False

            # 2. Удаляем задачу. 
            await db.delete(db_task)
            
            await db.commit()
            return True

        except Exception as ex:
            print("Ошибка при удалении задачи:", ex)
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при удалении задачи: {str(e)}"
            )
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def task_state_change_service(role_info: tuple, task_id: int, task_state: TaskStateSchema, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if (role_info[2] == Role.ADMIN.value) or (role_info[2] == Role.EDITOR.value):
        # 1. Получаем текущую таску 3-мя полями. А с фронта принимаем 2 поля. И возвращаем ответ
        query = await db.execute(select(Task).where(Task.id == task_id).options(
                    load_only(
                    Task.state,
                    Task.updated_at
                    )
                ))    
        task = query.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="task not found")
        
        # # 2. Обновляем задачу    
        task.state = task_state.state
        task.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(task)
        
        # возвращаем 2 поля.
        return task
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})



async def search_user_service(role_info: tuple, email_user: EmailStr, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if role_info[2] == Role.ADMIN.value:
        try:
            query = await db.execute(select(User).where(User.email == email_user).options(
                    load_only(
                    User.name,
                    User.email,
                    User.id
                    )
                ))
            db_user = query.scalar()
            # print("!!!!!!!!!!!!!!!!!!")
            # print(db_user)
            if db_user == None:
                # raise HTTPException(status_code=400, detail=f"Ошибка при поиске пользователя: {str(ex)}")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

            query_user_project = await db.execute(
                    (select(ProjectUserAssociation)
                    .where(ProjectUserAssociation.user_id == db_user.id)
                    .where(ProjectUserAssociation.project_id == role_info[0])
                    ))
            user_project = query_user_project.scalar_one_or_none()
            if user_project == None:
                invite = True
            elif user_project != None:
                invite = False

            return {"user": db_user, "invite": invite}
        except Exception as ex:            
            raise HTTPException(status_code=400, detail=f"Ошибка при поиске пользователя: {str(ex)}")

    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def invite_to_project_service(role_info: tuple, user_invite: User_invite_to_project_schema, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=user_invite.project_id)

    if role_info[2] == Role.ADMIN.value:
        try:
            # запросили пользователя
            query_user = await db.execute(select(User).where(User.id == user_invite.user_id))    
            db_user = query_user.scalar()
            # запросили проект
            query_project = await db.execute(select(Project).where(Project.id == role_info[0]))    
            db_project = query_project.scalar()
            # создали связь пользователя с проектом с ролью гость
            association = db_project.add_user(db_user)
            db.add(association)
            await db.commit()
            await db.refresh(association)

            return {"Ответ": "Все отлично!"}
        except Exception as ex:
            print("Ошибка при добавлении пользователя в проект ниже!!!")
            print(ex)
            raise HTTPException(status_code=400, detail=f"Ошибка при добавлении пользователя в проект: {str(ex)}")
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def exclude_from_project_service(role_info: tuple, user_exclude: User_invite_to_project_schema, db: AsyncSession):

    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=user_exclude.project_id)

    if role_info[2] == Role.ADMIN.value:

        try:
            # current_user_id = await verify_user_service(request=request)

            # query_current_user = await db.execute(select(User).where(User.id == current_user_id))
            # current_user = query_current_user.scalar()
            # тут проверяем токены пользака из токена и токен которого удаляем
            if role_info[1] == user_exclude.user_id:
                return {"answer": "Нельзя удалить себя!"}


            query_user_project = await db.execute(
                    (select(ProjectUserAssociation)
                    .where(ProjectUserAssociation.user_id == user_exclude.user_id)
                    .where(ProjectUserAssociation.project_id == role_info[0])
                    ))
            user_project = query_user_project.scalar_one_or_none()
            
            await db.delete(user_project)
            
            await db.commit()
            return True        
        except Exception as ex:
            print("Ошибка при удалении пользователя из проекта ниже!!!")
            print(ex)
            raise HTTPException(status_code=400, detail=f"Ошибка при исключении пользователя из проекта: {str(ex)}")
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def all_current_users_project_service(role_info: tuple, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if role_info[2] == Role.ADMIN.value:
        try:
            query = (
                select(User.name, User.email, User.id, ProjectUserAssociation.role)
                .join(ProjectUserAssociation, User.id == ProjectUserAssociation.user_id)
                .where(ProjectUserAssociation.project_id == role_info[0])
            )
            users_project = await db.execute(query)        
            return users_project        
        except Exception as ex:
            print("Ошибка валидации!!!!!!!!!!!!!")
            print(ex)
            raise HTTPException(status_code=400, detail=f"Ошибка при запросе пользователей: {str(ex)}")
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})
    

async def role_project_change_service(role_info: tuple, user_role: User_role_change_schema, db: AsyncSession):
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=user_role.project_id)

    if role_info[2] == Role.ADMIN.value:
    
        # 1. Получаем текущую таску 3-мя полями. А с фронта принимаем 2 поля. И возвращаем ответ
        query_user_project = await db.execute(
                    (select(ProjectUserAssociation)
                    .where(ProjectUserAssociation.user_id == user_role.user_id)
                    .where(ProjectUserAssociation.project_id == role_info[0])
                    ))
        user_project = query_user_project.scalar_one_or_none()

        if not user_project:
            raise HTTPException(status_code=404, detail="task not found")
        
        # 2. Обновляем роль
        user_project.role = user_role.role    
        await db.commit()
        await db.refresh(user_project)
        
        # возвращаем роль.
        return user_project
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role[2]} - is not suitable for this action"})


# ост тут
async def delete_project_service(role_info: tuple, db: AsyncSession) -> bool:
    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if role_info[2] == Role.ADMIN.value:
        try:
            # удаляем связь проекта из таблицы ассоциаций
            await db.execute(
                delete(ProjectUserAssociation).where(ProjectUserAssociation.project_id == role_info[0])
            )
            await db.commit()

            # удаляем сам проект
            query = await db.execute(select(Project).where(Project.id == role_info[0]))    
            db_project = query.scalar()
            if not db_project:
                return False

            # 2. Удаляем проект. 
            await db.delete(db_project)
            
            await db.commit()
            return True

        except Exception as ex:
            print("Ошибка при удалении проекта:", ex)
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при удалении проекта: {str(ex)}"
            )
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})


async def delete_section_service(role_info: tuple, section_id: int, db: AsyncSession) -> bool:

    # role = await parse_role_service(request=request)
    # verify = await verify_project_service(role=role, project_id=project_id)

    if role_info[2] == Role.ADMIN.value:
        try:
            query = await db.execute(select(Section).where(Section.id == section_id))
            db_section = query.scalar()
            if not db_section:
                return False

            # 2. Удаляем проект. 
            await db.delete(db_section)
            
            await db.commit()
            return True

        except Exception as ex:
            print("Ошибка при удалении секции:", ex)
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при удалении секции: {str(ex)}"
            )
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! роль не та")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "role_denied", "message": f"Your role - {role_info[2]} - is not suitable for this action"})



# создание токена с ролью для проекта
async def create_project_token_service(user_id: int, project_id: User_project_role_schema, db: AsyncSession, expires_delta: timedelta | None = None):

    # current_user_id = await verify_user_service(request=request)

    # if not current_user_id:
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="401_UNAUTHORIZED")

    query_user_project = await db.execute(
                (select(ProjectUserAssociation)
                .where(ProjectUserAssociation.user_id == user_id)
                .where(ProjectUserAssociation.project_id == project_id.project_id)
                ))
    user_project = query_user_project.scalar_one_or_none()
    if not user_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "access_denied", "message": "User is not a member of this project"})    
    
    data = {"project_id": user_project.project_id , "user_id": user_project.user_id, "role": user_project.role.value}

    to_encode = data.copy()
    if expires_delta:#если задано время истекания токена, то к текущему времени мы добавляем время истекания
        expire = datetime.utcnow() + expires_delta
    #expires_delta это если делать какую-то
    else:#иначе задаем время истекания также 30 мин
        expire = datetime.utcnow() + timedelta(minutes=int(EXPIRE_TIME_PROJECT_TOKEN))#протестить длительность токена с 0 минут
    to_encode.update({"exp": expire})#тут мы добавили элемент в словарь который скопировали выше элемент с ключом "exp" и значением времени, которое сделали строкой выше. 
    encoded_jwt = jwt.encode(to_encode, PROJECT_KEY, algorithm=ALG)#тут мы кодируем наш токен.
    return {"Project_token": encoded_jwt}


