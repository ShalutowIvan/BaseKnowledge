# routes/admin_codes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta, timezone 
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_
from ..models import *
from db_api import get_async_session
from ..schemas import *
from .utils_codes import *
from .dependencies import require_admin


router_admin_panel = APIRouter(prefix="/admin/codes", tags=["Admin_panel"])

# создание кода активации админом
@router_admin_panel.post("/create", response_model=ActivationCodeResponse)
async def create_activation_code(
    days_valid: int = Query(30, ge=1, le=365, description="Срок действия в днях"),
    # note: Optional[str] = Query(None, max_length=255),
    admin_id: int = Depends(require_admin),#надо понять откуда берется это
    db: AsyncSession = Depends(get_async_session)
    ):
    """Создать новый код активации"""
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

# код создается, но там схема ответа мутная, надо смотреть что там за схемы, ОСТ ТУТ

# # получение списка кодов активации
# @router_admin_panel.get("/", response_model=PaginatedResponseCodes)
# async def get_activation_codes(
#     status_filter: Optional[str] = Query(None, regex="^(active|used|expired|deactivated|all)$"),
#     page: int = 1,
#     per_page: int = 50,
#     admin: User = Depends(require_admin),
#     db: AsyncSession = Depends(get_async_session)
# ):
#     try:
#         """Получить список кодов активации с деталями"""

#         if page < 1 or per_page < 1:
#             raise HTTPException(
#                 status_code=403,
#                     detail="Номер страницы и размер страницы должны быть положительными числами"
#                 )

#         if per_page > 100:
#             raise HTTPException(
#                     status_code=400, 
#                     detail="Размер страницы не может превышать 100"
#                 )

#         offset = (page - 1) * per_page
        
#         data_query = select(ActivationCode)

#         count_query = select(func.count(ActivationCode.id))

#         data_query = data_query.order_by(ActivationCode.created_at.desc())        

#         data_query = data_query.limit(per_page).offset(offset)

#         data_result = await db.execute(data_query)
        
#         count_result = await db.execute(count_query)

#         items_data = data_result.all()
                
#         total_count = count_result.scalar()

#         total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1

#         if page > total_pages and total_pages > 0:
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"Страница {page} не найдена. Всего страниц: {total_pages}"
#             )

#         first_item = items[0]["id"] if items else None
#         last_item = items[-1]["id"] if items else None

#         has_next = page < total_pages
#         has_prev = page > 1

#         # Обновляем статусы просроченных кодов. В базе статусы кодов не обновляются пока мы к ним не обратимся и сами не обновим с помощью кода ниже. 
#         expired_codes = [c for c in items_data if c.status == ActivationCodeStatus.NOT_ACTIVATED and datetime.utcnow() > c.expires_at]
#         for code in expired_codes:
#             code.status = ActivationCodeStatus.EXPIRED

#         if expired_codes:
#             await db.commit()
        
#         return PaginatedResponseCodes(
#                 items=items_data,
#                 total=total_count,
#                 page=page,
#                 per_page=per_page,
#                 total_pages=total_pages,
#                 has_next=has_next,
#                 has_prev=has_prev,
#                 first_item=first_item,
#                 last_item=last_item
#             )


#         # # Фильтрация по статусу. Пока не надо. Если что добавить можно
#         # if status_filter and status_filter != "all":
#         #     if status_filter == "expired":
#         #         query = query.filter(
#         #             (ActivationCode.status == "active") &
#         #             (ActivationCode.expires_at < datetime.utcnow())
#         #         )
#         #     else:
#         #         query = query.filter(ActivationCode.status == status_filter)
        
        
        
    
#     except HTTPException:        
#         raise

#     except Exception as ex:
#         # Логируем ошибку и возвращаем пользователю
#         print(f"Ошибка в knowledges_in_group_service: {str(ex)}")
#         raise HTTPException(
#             status_code=400, 
#             detail="Ошибка при получении данных"
#         )


# @router_admin_panel.post("/{code_id}/deactivate")
# def deactivate_code(
#     code_id: int,
#     admin: User = Depends(require_admin),
#     db: Session = Depends(get_db)
# ):
#     """Деактивировать код и пользователя"""
#     code = db.query(ActivationCode).filter(ActivationCode.id == code_id).first()
    
#     if not code:
#         raise HTTPException(status_code=404, detail="Код не найден")
    
#     if code.status == "deactivated":
#         raise HTTPException(status_code=400, detail="Код уже деактивирован")
    
#     if code.status != "used":
#         raise HTTPException(status_code=400, detail="Можно деактивировать только использованные коды")
    
#     # Деактивируем код
#     code.status = "deactivated"
    
#     # Деактивируем пользователя, если он существует
#     if code.user_id:
#         user = db.query(User).filter(User.id == code.user_id).first()
#         if user:
#             user.is_active = False
#             user.activated_at = None
            
#             # Создаем запись в лог
#             log = DeactivationLog(
#                 user_id=user.id,
#                 code_id=code.id,
#                 deactivated_by=admin.id,
#                 reason="manual_deactivation"
#             )
#             db.add(log)
    
#     db.commit()
    
#     return {"message": "Код и пользователь деактивированы"}


# @router_admin_panel.delete("/{code_id}")
# def delete_activation_code(
#     code_id: int,
#     admin: User = Depends(require_admin),
#     db: Session = Depends(get_db)
# ):
#     """Удалить код активации"""
#     code = db.query(ActivationCode).filter(ActivationCode.id == code_id).first()
    
#     if not code:
#         raise HTTPException(status_code=404, detail="Код не найден")
    
#     if code.status == "used":
#         raise HTTPException(
#             status_code=400, 
#             detail="Нельзя удалить использованный код. Сначала деактивируйте его."
#         )
    
#     if code.user_id:
#         raise HTTPException(
#             status_code=400, 
#             detail="Код привязан к пользователю. Сначала деактивируйте."
#         )
    
#     db.delete(code)
#     db.commit()
    
#     return {"message": "Код удален"}


# @router_admin_panel.post("/bulk-create")
# def bulk_create_codes(
#     count: int = Query(10, ge=1, le=100),
#     days_valid: int = 30,
#     admin: User = Depends(require_admin),
#     db: Session = Depends(get_db)
# ):
#     """Создать несколько кодов сразу"""
#     created_codes = []
    
#     for _ in range(count):
#         while True:
#             code = generate_activation_code()
#             exists = db.query(ActivationCode).filter(ActivationCode.code == code).first()
#             if not exists:
#                 break
        
#         activation_code = ActivationCode(
#             code=code,
#             status="active",
#             expires_at=datetime.utcnow() + timedelta(days=days_valid),
#             created_by=admin.id
#         )
        
#         db.add(activation_code)
#         created_codes.append(code)
    
#     db.commit()
    
#     return {
#         "message": f"Создано {count} кодов",
#         "codes": created_codes
#     }