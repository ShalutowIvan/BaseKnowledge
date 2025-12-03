# 1. Конфигурация

from dataclasses import dataclass
from pathlib import Path

@dataclass
class StorageConfig:
    """Конфигурация хранения файлов"""
    UPLOAD_FOLDER = Path("uploads/images")
    THUMBNAIL_FOLDER = Path("uploads/thumbnails")
    
    # Лимиты
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_IMAGE_SIZE_MB = 5  # Максимальный размер после сжатия
    MAX_IMAGES_PER_KNOWLEDGE = 20
    MAX_IMAGES_PER_USER = 100
    MAX_STORAGE_PER_USER_MB = 500  # 500MB на пользователя
    
    # Валидация
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/png', 'image/gif', 
        'image/webp', 'image/bmp'
    }
    
    # Сжатие
    COMPRESS_ON_UPLOAD = True
    COMPRESSION_QUALITY = 85  # 0-100
    MAX_DIMENSIONS = (1920, 1080)  # Максимальная ширина, высота
    CREATE_THUMBNAILS = True
    THUMBNAIL_SIZE = (400, 400)
    
    # Очистка
    CLEANUP_DAYS = 30  # Удалять файлы старше 30 дней
    CLEANUP_ORPHANED_FILES = True

config = StorageConfig()