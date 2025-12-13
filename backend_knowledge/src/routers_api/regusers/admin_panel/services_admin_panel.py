from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_
from ..models import *
from ..schemas import *
from .utils_codes import *
import math


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
async def get_activation_codes_services(
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
        
        data_query = select(ActivationCode)

        count_query = select(func.count(ActivationCode.id))

        data_query = data_query.order_by(ActivationCode.created_at.desc())        

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
        print(f"Ошибка в get_activation_codes_services: {str(ex)}")
        raise HTTPException(
            status_code=400, 
            detail="Ошибка при получении данных"
        )


# """Активировать аккаунт пользователя по коду"""
async def activate_code_service(
    code_data: ActivateAccountRequest,
    user_id: int,
    db: AsyncSession
    ):    
    
    query = select(ActivationCode).where(
        ActivationCode.code == code_data.code.strip().upper(), 
        ActivationCode.status == ActivationCodeStatus.NOT_ACTIVATED
        )
    result = await db.execute(query)
    code = result.scalar_one_or_none()

    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code not found or not access for activated"
        )
    
    # Проверяем срок действия
    if datetime.now(timezone.utc) > code.expires_at:
        code.status = ActivationCodeStatus.EXPIRED
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The code has expired"
        )
    
    # Проверяем, не использован ли код другим пользователем
    if code.user_id and code.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The code has already been used by another user."
        )
    
    # Активируем пользователя
    query_user = select(User).where(User.id == user_id)
    result_user = await db.execute(query_user)
    current_user = result_user.scalar_one_or_none()

    current_user.service_active = True
    current_user.activated_at = datetime.now(timezone.utc)
    
    # Обновляем код
    code.status = ActivationCodeStatus.ACTIVATED
    code.user_id = current_user.id
    code.used_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {
        "message": "Аккаунт успешно активирован",
        "user": {
            "email": current_user.email,
            "username": current_user.name,
            "service_active": current_user.service_active
        },
        # "code": {
        #     "code": code.code,
        #     "created_by_admin": code.creator_admin.email if code.creator_admin else "Unknown"
        # }
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
        # user = db.query(User).filter(User.id == code.user_id).first()
        query_user = select(User).where(User.id == code.user_id)
        result_user = await db.execute(query_user)
        user = result_user.scalar_one_or_none()
        if user:
            user.service_active = False            
    
    await db.commit()
    
    return {"message": "Код и пользователь деактивированы"}







