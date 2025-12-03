# 5. Сервис управления хранилищем

from sqlalchemy import select, func
from datetime import datetime, timedelta
import asyncio
from pathlib import Path

class StorageManager:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def check_user_limits(self, user_id: int, new_file_size: int) -> bool:
        """Проверка лимитов пользователя"""
        # Проверка количества файлов
        user_files_count = await self.db.execute(
            select(func.count(Image.id))
            .join(Knowledge)
            .where(Knowledge.user_id == user_id)
        )
        files_count = user_files_count.scalar() or 0
        
        if files_count >= config.MAX_IMAGES_PER_USER:
            raise HTTPException(
                status_code=400,
                detail=f"User image limit reached ({config.MAX_IMAGES_PER_USER})"
            )
        
        # Проверка общего объема
        user_storage = await self.db.execute(
            select(UserStorage)
            .where(UserStorage.user_id == user_id)
        )
        storage = user_storage.scalar_one_or_none()
        
        if storage:
            if storage.total_storage_bytes + new_file_size > config.MAX_STORAGE_PER_USER_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"User storage limit reached ({config.MAX_STORAGE_PER_USER_MB}MB)"
                )
        
        return True
    
    async def check_knowledge_limits(self, knowledge_id: int, new_file_size: int) -> bool:
        """Проверка лимитов знания"""
        # Проверка количества файлов
        knowledge_files = await self.db.execute(
            select(func.count(Image.id))
            .where(Image.knowledge_id == knowledge_id)
        )
        files_count = knowledge_files.scalar() or 0
        
        if files_count >= config.MAX_IMAGES_PER_KNOWLEDGE:
            raise HTTPException(
                status_code=400,
                detail=f"Knowledge image limit reached ({config.MAX_IMAGES_PER_KNOWLEDGE})"
            )
        
        # Проверка общего объема файлов знания
        knowledge_files_size = await self.db.execute(
            select(func.sum(func.length(Image.filepath)))  # Здесь нужно хранить размер в БД
            .where(Image.knowledge_id == knowledge_id)
        )
        total_size = knowledge_files_size.scalar() or 0
        
        max_knowledge_size = 100 * 1024 * 1024  # 100MB на знание
        
        if total_size + new_file_size > max_knowledge_size:
            raise HTTPException(
                status_code=400,
                detail=f"Knowledge storage limit reached (100MB)"
            )
        
        return True
    
    async def update_user_storage(self, user_id: int, file_size: int, increment: bool = True):
        """Обновление статистики хранилища пользователя"""
        storage = await self.db.execute(
            select(UserStorage)
            .where(UserStorage.user_id == user_id)
        )
        storage = storage.scalar_one_or_none()
        
        if not storage:
            storage = UserStorage(user_id=user_id)
            self.db.add(storage)
        
        if increment:
            storage.total_files_count += 1
            storage.total_storage_bytes += file_size
        else:
            storage.total_files_count = max(0, storage.total_files_count - 1)
            storage.total_storage_bytes = max(0, storage.total_storage_bytes - file_size)
        
        storage.last_updated = datetime.utcnow()
        await self.db.commit()
    
    async def cleanup_orphaned_files(self):
        """Очистка неиспользуемых файлов"""
        if not config.CLEANUP_ORPHANED_FILES:
            return
        
        upload_folder = Path(config.UPLOAD_FOLDER)
        thumbnail_folder = Path(config.THUMBNAIL_FOLDER)
        
        if not upload_folder.exists():
            return
        
        # Получаем все файлы из БД
        result = await self.db.execute(select(Image.filename))
        db_files = set([row[0] for row in result])
        
        # Находим файлы в папке загрузок
        uploaded_files = set([f.name for f in upload_folder.iterdir() if f.is_file()])
        thumbnail_files = set([f.name for f in thumbnail_folder.iterdir() if f.is_file()]) if thumbnail_folder.exists() else set()
        
        # Находим orphaned файлы
        orphaned_uploads = uploaded_files - db_files
        orphaned_thumbnails = thumbnail_files - db_files
        
        deleted_count = 0
        total_freed = 0
        
        # Удаляем orphaned файлы
        for filename in orphaned_uploads:
            filepath = upload_folder / filename
            try:
                file_size = filepath.stat().st_size
                filepath.unlink()
                deleted_count += 1
                total_freed += file_size
            except Exception as e:
                print(f"Error deleting {filename}: {e}")
        
        for filename in orphaned_thumbnails:
            filepath = thumbnail_folder / filename
            try:
                file_size = filepath.stat().st_size
                filepath.unlink()
                deleted_count += 1
                total_freed += file_size
            except Exception as e:
                print(f"Error deleting thumbnail {filename}: {e}")
        
        print(f"Cleanup: deleted {deleted_count} files, freed {total_freed/1024/1024:.2f}MB")
        return deleted_count, total_freed
    
    async def cleanup_old_files(self, days_old: int = 30):
        """Очистка файлов старше указанного количества дней"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Находим изображения старше cutoff_date
        old_images = await self.db.execute(
            select(Image)
            .where(Image.created_at < cutoff_date)
            .where(Image.knowledge_id.is_(None))  # Или не привязанные к знаниям
        )
        old_images = old_images.scalars().all()
        
        deleted_count = 0
        total_freed = 0
        
        for image in old_images:
            try:
                # Удаляем файл
                filepath = Path(config.UPLOAD_FOLDER) / image.filename
                thumbnail_path = Path(config.THUMBNAIL_FOLDER) / image.filename
                
                if filepath.exists():
                    file_size = filepath.stat().st_size
                    filepath.unlink()
                    total_freed += file_size
                
                if thumbnail_path.exists():
                    thumb_size = thumbnail_path.stat().st_size
                    thumbnail_path.unlink()
                    total_freed += thumb_size
                
                # Удаляем запись из БД
                await self.db.delete(image)
                deleted_count += 1
                
            except Exception as e:
                print(f"Error deleting old file {image.filename}: {e}")
        
        await self.db.commit()
        print(f"Cleaned {deleted_count} old files, freed {total_freed/1024/1024:.2f}MB")
        return deleted_count, total_freed