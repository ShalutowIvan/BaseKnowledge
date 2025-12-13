# routes/admin_codes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from db_api import get_async_session
from ..schemas import *
from .dependencies import require_admin, require_active_user
from .services_admin_panel import *





router_admin_panel = APIRouter(prefix="/admin/codes", tags=["Admin_panel"])


# создание кода активации админом
@router_admin_panel.post("/create", response_model=ActivationCodeResponse)
async def create_activation_code(
    days_valid: int = Query(30, ge=1, le=365, description="Срок действия в днях"),
    # note: Optional[str] = Query(None, max_length=255),
    admin_id: int = Depends(require_admin),#надо понять откуда берется это
    db: AsyncSession = Depends(get_async_session)
    ):
    return await create_activation_code_service(days_valid=days_valid, admin_id=admin_id, db=db)
    


# # получение списка кодов активации
@router_admin_panel.get("/", response_model=PaginatedResponseCodes)
async def get_activation_codes(
    status_filter: Optional[str] = Query(None, regex="^(active|used|expired|deactivated|all)$"),
    page: int = 1,
    per_page: int = 50,
    admin_id: int = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session)
    ):
    
    return await get_activation_codes_services(status_filter=status_filter, page=page, per_page=per_page, admin_id=admin_id, db=db)


# деактивация кода
@router_admin_panel.post("/{code_id}/deactivate")
async def deactivate_code(
    code_id: int,
    admin_id: int = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session)
    ):
    return await deactivate_code_service(code_id=code_id, admin_id=admin_id, db=db)




# активация кода и сервисов юзера
@router_admin_panel.post("/activate")
async def activate_code(    
    code_data: ActivateAccountRequest,
    user_id: int = Depends(require_active_user),#тут проверка не активирован ли уже пользак
    db: AsyncSession = Depends(get_async_session)
    ):
    return await activate_code_service(code_data=code_data, user_id=user_id, db=db)








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