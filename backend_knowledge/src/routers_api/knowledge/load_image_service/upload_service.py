# 6. Основной сервис загрузки

import aiofiles
from fastapi import UploadFile, HTTPException, Request
import uuid
import os

class UploadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.validator = FileValidator()
        self.compressor = ImageCompressor()
        self.storage_manager = StorageManager(db)
    
    async def upload_image(
        self,
        request: Request,
        knowledge_id: int,
        user_id: int,
        file: UploadFile,
        compress: bool = None
    ) -> dict:
        """Основной метод загрузки изображения"""
        if compress is None:
            compress = config.COMPRESS_ON_UPLOAD
        
        try:
            # 1. Чтение файла
            file_content = await file.read()
            original_size = len(file_content)
            
            # 2. Комплексная валидация
            validation = await self.validator.comprehensive_validation(
                file_content=file_content,
                filename=file.filename,
                max_size=config.MAX_FILE_SIZE,
                allowed_extensions=config.ALLOWED_EXTENSIONS,
                allowed_mime_types=config.ALLOWED_MIME_TYPES,
                max_dimensions=config.MAX_DIMENSIONS
            )
            
            if not validation["is_valid"]:
                raise HTTPException(
                    status_code=400,
                    detail="; ".join(validation["errors"])
                )
            
            # 3. Проверка лимитов
            await self.storage_manager.check_user_limits(user_id, original_size)
            await self.storage_manager.check_knowledge_limits(knowledge_id, original_size)
            
            # 4. Сжатие если нужно
            if compress:
                try:
                    file_content = await self.compressor.compress_image(
                        file_content,
                        quality=config.COMPRESSION_QUALITY,
                        max_dimensions=config.MAX_DIMENSIONS,
                        output_format="WEBP"
                    )
                except Exception as e:
                    print(f"Compression skipped: {e}")
                    # Продолжаем с оригинальным файлом
            
            final_size = len(file_content)
            
            # 5. Генерация имени файла
            file_ext = "webp" if compress else file.filename.rsplit('.', 1)[-1].lower()
            filename = f"{uuid.uuid4()}.{file_ext}"
            
            # 6. Сохранение основного файла
            upload_path = Path(config.UPLOAD_FOLDER)
            upload_path.mkdir(parents=True, exist_ok=True)
            
            filepath = upload_path / filename
            
            async with aiofiles.open(filepath, "wb") as buffer:
                await buffer.write(file_content)
            
            # 7. Создание thumbnail если нужно
            thumbnail_path = None
            if config.CREATE_THUMBNAILS:
                thumbnail_folder = Path(config.THUMBNAIL_FOLDER)
                thumbnail_folder.mkdir(parents=True, exist_ok=True)
                
                thumbnail_content = await self.compressor.create_thumbnail(
                    file_content,
                    size=config.THUMBNAIL_SIZE
                )
                
                thumbnail_path = thumbnail_folder / filename
                async with aiofiles.open(thumbnail_path, "wb") as buffer:
                    await buffer.write(thumbnail_content)
            
            # 8. Сохранение в БД
            db_image = Image(
                filename=filename,
                filepath=f"/uploads/images/{filename}",
                knowledge_id=knowledge_id,
                file_size=final_size,
                original_size=original_size,
                compressed=compress
            )
            
            self.db.add(db_image)
            await self.db.commit()
            await self.db.refresh(db_image)
            
            # 9. Обновление статистики пользователя
            await self.storage_manager.update_user_storage(user_id, final_size, increment=True)
            
            # 10. Формирование ответа
            base_url = str(request.base_url).rstrip('/')
            
            return {
                "id": db_image.id,
                "filename": filename,
                "url": f"{base_url}/uploads/images/{filename}",
                "thumbnail_url": f"{base_url}/uploads/thumbnails/{filename}" if thumbnail_path else None,
                "size_kb": final_size / 1024,
                "original_size_kb": original_size / 1024,
                "compressed": compress,
                "compression_ratio": f"{((original_size - final_size) / original_size * 100):.1f}%" if compress else "0%",
                "created_at": db_image.created_at
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Upload failed: {str(e)}"
            )
    
    async def batch_compress_existing(self, user_id: int = None):
        """Пакетное сжатие существующих изображений"""
        query = select(Image)
        if user_id:
            query = query.join(Knowledge).where(Knowledge.user_id == user_id)
        
        result = await self.db.execute(query)
        images = result.scalars().all()
        
        compressed_count = 0
        total_saved = 0
        
        for image in images:
            try:
                filepath = Path(config.UPLOAD_FOLDER) / image.filename
                
                if not filepath.exists():
                    continue
                
                with open(filepath, 'rb') as f:
                    original_content = f.read()
                
                # Сжимаем
                compressed_content = await self.compressor.compress_image(
                    original_content,
                    quality=config.COMPRESSION_QUALITY,
                    max_dimensions=config.MAX_DIMENSIONS
                )
                
                # Если сжатие эффективно
                if len(compressed_content) < len(original_content):
                    # Сохраняем сжатый файл
                    new_filename = f"{uuid.uuid4()}.webp"
                    new_filepath = Path(config.UPLOAD_FOLDER) / new_filename
                    
                    with open(new_filepath, 'wb') as f:
                        f.write(compressed_content)
                    
                    # Обновляем запись
                    saved_bytes = len(original_content) - len(compressed_content)
                    image.filename = new_filename
                    image.filepath = f"/uploads/images/{new_filename}"
                    image.file_size = len(compressed_content)
                    image.compressed = True
                    
                    # Удаляем старый файл
                    filepath.unlink()
                    
                    compressed_count += 1
                    total_saved += saved_bytes
                    
                    print(f"Compressed: {image.id} - saved {saved_bytes/1024:.1f}KB")
            
            except Exception as e:
                print(f"Failed to compress image {image.id}: {e}")
        
        await self.db.commit()
        
        return {
            "compressed_count": compressed_count,
            "total_saved_mb": total_saved / 1024 / 1024
        }