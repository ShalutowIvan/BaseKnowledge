from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_
from sqlalchemy.orm import selectinload, joinedload, load_only
from ..models import *
from ..schemas import *
from .utils_codes import *
import math
from typing import List, Dict


# """Создать новый код активации"""
async def create_activation_code_service(
    days_valid: int,
    # note: Optional[str] = Query(None, max_length=255),
    admin_id: int,#надо понять откуда берется это
    db: AsyncSession
    ):    
    # Генерируем уникальный код
    while True:
        code = generate_activation_code()
        # exists = db.query(ActivationCode).filter(ActivationCode.code == code).first()
        result = await db.execute(select(ActivationCode).where(ActivationCode.code == code))
        activation_code = result.scalar_one_or_none()
        #получается тут идет генарация кода пока не сгенерируется код который не будет совпадает с кодом из базы. немного кривой алгоритм
        if not activation_code:
            break
    
    expires_datetime_aware = datetime.now(timezone.utc) + timedelta(days=days_valid)
    # expires_at=datetime.utcnow() + timedelta(days=days_valid),
    # Создаем код
    activation_code = ActivationCode(
        code=code,
        status=ActivationCodeStatus.NOT_ACTIVATED,
        # note=note,
        expires_at=datetime.utcnow() + timedelta(days=days_valid),

        created_by=admin_id
    )
    
    db.add(activation_code)
    await db.commit()
    await db.refresh(activation_code)
    
    return activation_code


# """Получить список кодов активации с деталями"""
async def get_activation_codes_service(
    admin_id: int,
    db: AsyncSession,
    status_filter: str = None,
    page: int = 1,
    per_page: int = 50    
    ):
    
    try:
        if page < 1 or per_page < 1:
            raise HTTPException(
                status_code=403,
                    detail="Номер страницы и размер страницы должны быть положительными числами"
                )

        if per_page > 100:
            raise HTTPException(
                    status_code=400, 
                    detail="Размер страницы не может превышать 100"
                )

        offset = (page - 1) * per_page
        
        
        data_query = select(ActivationCode).options(joinedload(ActivationCode.activated_user))
        # data_query = select(ActivationCode).options(selectinload(ActivationCode.activated_user))

        count_query = select(func.count(ActivationCode.id))

        data_query = data_query.order_by(ActivationCode.created_at.desc())        

        data_query = data_query.limit(per_page).offset(offset)

        data_result = await db.execute(data_query)
        
        count_result = await db.execute(count_query)

        items_data = data_result.unique().scalars().all()

        total_count = count_result.scalar()

        total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1

        if page > total_pages and total_pages > 0:
            raise HTTPException(
                status_code=404,
                detail=f"Страница {page} не найдена. Всего страниц: {total_pages}"
            )       

        first_item = items_data[0].id if items_data else None#тут словарь в items_data?         
        last_item = items_data[-1].id if items_data else None

        has_next = page < total_pages
        has_prev = page > 1

        # Обновляем статусы просроченных кодов. В базе статусы кодов не обновляются пока мы к ним не обратимся и сами не обновим с помощью кода ниже. 
        expired_codes = [c for c in items_data if c.status == ActivationCodeStatus.NOT_ACTIVATED and datetime.now(timezone.utc) > c.expires_at ]
        for code in expired_codes:
            code.status = ActivationCodeStatus.EXPIRED

        if expired_codes:
            await db.commit()                
        
        return PaginatedResponseCodes(
                items=items_data,
                total=total_count,
                page=page,
                per_page=per_page,
                total_pages=total_pages,
                has_next=has_next,
                has_prev=has_prev,
                first_item=first_item,
                last_item=last_item
            )
           
    except HTTPException:        
        raise

    except Exception as ex:
        # Логируем ошибку и возвращаем пользователю
        print(f"Ошибка в get_activation_codes_service: {str(ex)}")
        raise HTTPException(
            status_code=400, 
            detail="Ошибка при получении данных"
        )


# вывод списка пользователей
async def list_users_service(
    admin_id: int,
    db: AsyncSession,
    status_service: bool = None,
    page: int = 1,
    per_page: int = 50    
    ):
    
    try:
        if page < 1 or per_page < 1:
            raise HTTPException(
                status_code=403,
                    detail="Номер страницы и размер страницы должны быть положительными числами"
                )

        if per_page > 100:
            raise HTTPException(
                    status_code=400, 
                    detail="Размер страницы не может превышать 100"
                )

        offset = (page - 1) * per_page        
        
        data_query = select(User)
        # .options(joinedload(ActivationCode.activated_user))
        # data_query = select(ActivationCode).options(selectinload(ActivationCode.activated_user))

        count_query = select(func.count(User.id))

        data_query = data_query.order_by(User.time_create_user.desc())        

        data_query = data_query.limit(per_page).offset(offset)

        data_result = await db.execute(data_query)
        
        count_result = await db.execute(count_query)

        items_data = data_result.scalars().all()

        total_count = count_result.scalar()

        total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1

        if page > total_pages and total_pages > 0:
            raise HTTPException(
                status_code=404,
                detail=f"Страница {page} не найдена. Всего страниц: {total_pages}"
            )       

        first_item = items_data[0].id if items_data else None
        last_item = items_data[-1].id if items_data else None

        has_next = page < total_pages
        has_prev = page > 1
                
        return PaginatedResponseUsers(
                items=items_data,
                total=total_count,
                page=page,
                per_page=per_page,
                total_pages=total_pages,
                has_next=has_next,
                has_prev=has_prev,
                first_item=first_item,
                last_item=last_item
            )
           
    except HTTPException:        
        raise

    except Exception as ex:
        # Логируем ошибку и возвращаем пользователю
        print(f"Ошибка в list_users_service: {str(ex)}")
        raise HTTPException(
            status_code=400, 
            detail="Ошибка при получении данных"
        )


async def change_user_service(user_id: int, user_update: ChangeUserSchema, admin_id: int, db: AsyncSession):
    
    try:
        query_user = select(User).where(User.id == user_id)
        result_user = await db.execute(query_user)
        user_object = result_user.scalar_one_or_none()
        if not user_object:
            raise HTTPException(status_code=404, detail="user not found")

        if user_update.name != user_object.name and user_update.name is not None:
            user_object.name = user_update.name


        if user_update.email != user_object.email and user_update.email is not None:
            # Проверяем, не занят ли email другим пользователем
            query_existing_user = select(User).where(User.email == user_update.email, User.id != user_id)
            result_existing_user = await db.execute(query_existing_user)
            existing_user = result_existing_user.scalar_one_or_none()
            if existing_user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

            user_object.email = user_update.email
            user_object.requires_password_reset = True


        if user_update.user_role != user_object.user_role and user_id != admin_id and user_update.user_role is not None:
            user_object.user_role = user_update.user_role
        elif user_id == admin_id:
            await db.commit()#сохраняем другие измененные данные
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot change your administrator role.")
        
        await db.commit()
        await db.refresh(user_object)

        return user_object

    except HTTPException:
        # Перебрасываем уже созданные HTTP исключения
        raise

    except Exception as ex:
        # logger.error(f"Unexpected error updating user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error in change_user_service: {ex}"
        )


# # """Активировать аккаунт пользователя по коду пользователем"""
# async def activate_code_user_service(
#     code_data: ActivateAccountRequest,
#     user_id: int,
#     db: AsyncSession
#     ):    
    
#     query = select(ActivationCode).where(
#         ActivationCode.code == code_data.code.strip().upper(), 
#         ActivationCode.status == ActivationCodeStatus.NOT_ACTIVATED
#         )
#     result = await db.execute(query)
#     code = result.scalar_one_or_none()

    
#     if not code:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Code not found or not access for activated"
#         )
    
#     # Проверяем срок действия
#     if datetime.now(timezone.utc) > code.expires_at:
#         code.status = ActivationCodeStatus.EXPIRED
#         await db.commit()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="The code has expired"
#         )
    
#     # Проверяем, не использован ли код другим пользователем
#     if code.user_id and code.user_id != user_id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="The code has already been used by another user."
#         )
    
#     # Активируем пользователя
#     query_user = select(User).where(User.id == user_id)
#     result_user = await db.execute(query_user)
#     current_user = result_user.scalar_one_or_none()

#     current_user.service_active = True
#     current_user.activated_at = datetime.now(timezone.utc)
    
#     # Обновляем код
#     code.status = ActivationCodeStatus.ACTIVATED
#     code.user_id = current_user.id
#     code.used_at = datetime.now(timezone.utc)
    
#     await db.commit()
    
#     return {
#         "message": "Аккаунт успешно активирован",
#         "user": {
#             "email": current_user.email,
#             "username": current_user.name,
#             "service_active": current_user.service_active
#         },
#         # "code": {
#         #     "code": code.code,
#         #     "created_by_admin": code.creator_admin.email if code.creator_admin else "Unknown"
#         # }
#     }



async def activate_code_admin_service(
    code_data: ActivateAccountRequest,    
    db: AsyncSession
    ):    
    # ищем код активации в базе
    query = select(ActivationCode).where(
        ActivationCode.code == code_data.code.strip().upper(), 
        ActivationCode.status == ActivationCodeStatus.NOT_ACTIVATED
        )
    result = await db.execute(query)
    code = result.scalar_one_or_none()

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code not found or not available for activation"
        )
    
    # Проверяем срок действия
    if datetime.now(timezone.utc) > code.expires_at:
        code.status = ActivationCodeStatus.EXPIRED
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The code has expired"
        )
    
    # Проверяем, не использован (не активирован) ли код другим пользователем
    if code.user_id and code.user_id != code_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The code has already been used by another user."
        )
        
    # Активируем пользователя
    # находим пользователя в базе
    query_user = select(User).where(User.id == code_data.user_id)
    result_user = await db.execute(query_user)
    current_user = result_user.scalar_one_or_none()

    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    # проверка не активирован ли уже пользователь. Это норм проверка вроде. 
    if current_user.service_active == True:
        raise HTTPException(status_code=422, detail="The User is already activated")

    current_user.service_active = True
    # current_user.activated_at = datetime.now(timezone.utc)
    
    # Обновляем код
    code.status = ActivationCodeStatus.ACTIVATED
    code.user_id = current_user.id
    # code.updated_at = datetime.now(timezone.utc)
    code.updated_at = datetime.utcnow() 
    
    await db.commit()
    
    return {
        "message": "Сервисы пользователя успешно активированы",
        "user": {
            "email": current_user.email,
            "username": current_user.name,
            "service_active": current_user.service_active
        }        
    }



# """Деактивировать код и пользователя""".
async def deactivate_code_service(
    code_id: int,
    admin_id: int,
    db: AsyncSession
    ):    
    query = select(ActivationCode).where(ActivationCode.id == code_id)    
    result = await db.execute(query)
    code = result.scalar_one_or_none()
    
    if not code:
        raise HTTPException(status_code=404, detail="Code not found")
    
    # if code.status == ActivationCodeStatus.DEACTIVATED:
    #     raise HTTPException(status_code=400, detail="Code already deactivated")
    
    if code.status != ActivationCodeStatus.ACTIVATED:
        raise HTTPException(status_code=400, detail="You must deactivated only activated codes")
    
    # Деактивируем код
    code.status = ActivationCodeStatus.DEACTIVATED
    
    # Деактивируем пользователя, если он существует
    if code.user_id:        
        query_user = select(User).where(User.id == code.user_id)
        result_user = await db.execute(query_user)
        user = result_user.scalar_one_or_none()
        if user:
            user.service_active = False
        # code.user_id = None#оставляем связь кода активации и пользака, это надо для истории и чтобы повторно код нельзя было переиспользовать
    code.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Код и пользователь деактивированы"}



async def delete_activation_code_service(
    code_id: int,
    admin_id: int,
    db: AsyncSession
    ):  

    query = select(ActivationCode).where(ActivationCode.id == code_id)
    result = await db.execute(query)
    code = result.scalar_one_or_none()
    
    if not code:
        raise HTTPException(status_code=404, detail="Code not found")
    
    if code.status == ActivationCodeStatus.ACTIVATED:
        raise HTTPException(
            status_code=400, 
            detail="You can't delete a used code."
        )
    
    
    if code.user_id:
        raise HTTPException(
            status_code=400, 
            detail="The code has already been used. It cannot be deleted."
        )
    
    await db.delete(code)    

    await db.commit()
    
    return {"message": "Code is delete"}


async def search_user_stats_by_email_service(
    session: AsyncSession,
    email: str,
    admin_id: int, 
    exact_match: bool = True,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Поиск статистики пользователя по email.
    
    Args:
        session: AsyncSession
        email: Email для поиска
        exact_match: True - точное совпадение, False - частичное
        limit: Максимальное количество результатов
    
    Returns:
        Список найденных пользователей со статистикой
    """
    # Базовая конструкция запроса
    stmt = (
        select(UserStats)
        .join(User, User.id == UserStats.user_id)
        .options(selectinload(UserStats.user))
    )
    
    # Условие поиска
    if exact_match:
        # Точное совпадение (регистрозависимое)
        stmt = stmt.where(User.email == email)
    else:
        # Частичное совпадение (регистронезависимое)
        stmt = stmt.where(User.email.ilike(f"%{email}%"))
    
    # Ограничение и сортировка
    stmt = stmt.order_by(User.email)
    # .limit(limit)
    
    # Выполняем запрос
    result = await session.execute(stmt)
    stats_list = result.scalars().all()
    
    
    # Форматируем результат
    users_stats = []
    for stats in stats_list:
        if stats.user:  # Проверяем, что пользователь есть
            users_stats.append({
                "user": {
                    "id": stats.user.id,
                    "username": stats.user.name,
                    "email": stats.user.email,
                    "created_at": stats.user.time_create_user.isoformat() if stats.user.time_create_user else None
                },
                "stats": {
                    "knowledge": {
                        "count": stats.knowledge_count,
                        "total_size_bytes": stats.knowledge_total_size,
                        "average_size_bytes": stats.knowledge_average_text_size
                    },
                    "images": {
                        "count": stats.images_count,
                        "total_size_bytes": stats.images_total_size,
                        "average_size_bytes": stats.images_average_size
                    },
                    "projects": {
                        "count": stats.projects_count,
                        "sections_count": stats.sections_count,
                        "tasks_count": stats.tasks_count,
                        "tasks_total_size_bytes": stats.tasks_total_size,
                        "tasks_average_size_bytes": stats.tasks_average_size
                    }
                },
                "timestamps": {
                    "updated_at": stats.updated_at.isoformat() if stats.updated_at else None,
                    "last_activity_at": stats.last_activity_at.isoformat() if stats.last_activity_at else None
                }
            })
    
    return users_stats

