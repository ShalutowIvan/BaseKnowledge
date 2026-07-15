# 7. FastAPI эндпоинты. Их вставить там где роутеры знаний. И переделать
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from services.upload_service import UploadService
from services.storage_manager import StorageManager
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/knowledge/{knowledge_id}/image")
async def upload_image(
    knowledge_id: int,
    file: UploadFile = File(...),
    compress: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    request: Request = None
):
    """Загрузка изображения для знания"""
    upload_service = UploadService(db)
    
    return await upload_service.upload_image(
        request=request,
        knowledge_id=knowledge_id,
        user_id=current_user["id"],
        file=file,
        compress=compress
    )

@router.post("/admin/cleanup")
async def cleanup_files(
    background_tasks: BackgroundTasks,
    days_old: int = 30,
    cleanup_orphaned: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Административная очистка файлов (только для админов)"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    storage_manager = StorageManager(db)
    
    async def run_cleanup():
        if cleanup_orphaned:
            await storage_manager.cleanup_orphaned_files()
        await storage_manager.cleanup_old_files(days_old)
    
    # Запускаем в фоне
    background_tasks.add_task(run_cleanup)
    
    return {"message": "Cleanup started in background"}

@router.post("/admin/compress-all")
async def compress_all_images(
    background_tasks: BackgroundTasks,
    user_id: int = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Пакетное сжатие всех изображений"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    upload_service = UploadService(db)
    
    # Запускаем в фоне
    background_tasks.add_task(upload_service.batch_compress_existing, user_id)
    
    return {"message": "Batch compression started in background"}

@router.get("/storage/stats")
async def get_storage_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статистики хранилища"""
    storage_manager = StorageManager(db)
    
    user_files_count = await db.execute(
        select(func.count(Image.id))
        .join(Knowledge)
        .where(Knowledge.user_id == current_user["id"])
    )
    files_count = user_files_count.scalar() or 0
    
    user_storage = await db.execute(
        select(UserStorage)
        .where(UserStorage.user_id == current_user["id"])
    )
    storage = user_storage.scalar_one_or_none()
    
    return {
        "user_id": current_user["id"],
        "files_count": files_count,
        "max_files": config.MAX_IMAGES_PER_USER,
        "storage_used_mb": (storage.total_storage_bytes / 1024 / 1024) if storage else 0,
        "storage_limit_mb": config.MAX_STORAGE_PER_USER_MB,
        "percentage_used": (
            (storage.total_storage_bytes / (config.MAX_STORAGE_PER_USER_MB * 1024 * 1024)) * 100 
            if storage else 0
        )
    }