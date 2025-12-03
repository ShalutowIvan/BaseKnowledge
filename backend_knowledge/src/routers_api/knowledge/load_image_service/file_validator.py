# 3. Сервис валидации файлов

from PIL import Image as PILImage
import imghdr
import magic
from io import BytesIO
from fastapi import HTTPException


class FileValidator:
    @staticmethod
    async def validate_file_size(file_content: bytes, max_size: int) -> bool:
        """Проверка размера файла"""
        return len(file_content) <= max_size
    
    @staticmethod
    async def validate_extension(filename: str, allowed_extensions: set) -> bool:
        """Проверка расширения файла"""
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in allowed_extensions
    
    @staticmethod
    async def validate_mime_type(file_content: bytes, allowed_mime_types: set) -> bool:
        """Проверка MIME типа через python-magic"""
        try:
            import magic
            mime = magic.from_buffer(file_content, mime=True)
            return mime in allowed_mime_types
        except ImportError:
            # Fallback: проверка через imghdr
            image_type = imghdr.what(None, h=file_content)
            return image_type in ['jpeg', 'png', 'gif', 'bmp', 'webp']
    
    @staticmethod
    async def validate_is_image(file_content: bytes) -> bool:
        """Глубокая проверка, что файл действительно изображение"""
        try:
            # Проверка через PIL
            image = PILImage.open(BytesIO(file_content))
            image.verify()  # Проверка целостности файла
            
            # Дополнительная проверка: попытка загрузить
            image = PILImage.open(BytesIO(file_content))
            image.load()  # Загружаем данные
            return True
        except Exception:
            return False
    
    @staticmethod
    async def validate_dimensions(file_content: bytes, max_dimensions: tuple) -> tuple:
        """Проверка размеров изображения"""
        try:
            image = PILImage.open(BytesIO(file_content))
            return image.size[0] <= max_dimensions[0] and image.size[1] <= max_dimensions[1]
        except Exception:
            return False
    
    @staticmethod
    async def comprehensive_validation(
        file_content: bytes,
        filename: str,
        max_size: int,
        allowed_extensions: set,
        allowed_mime_types: set,
        max_dimensions: tuple
    ) -> dict:
        """Комплексная валидация файла"""
        errors = []
        
        # 1. Проверка размера
        if not await FileValidator.validate_file_size(file_content, max_size):
            errors.append(f"File size exceeds {max_size/1024/1024}MB")
        
        # 2. Проверка расширения
        if not await FileValidator.validate_extension(filename, allowed_extensions):
            errors.append(f"File extension not allowed. Allowed: {', '.join(allowed_extensions)}")
        
        # 3. Проверка MIME типа
        if not await FileValidator.validate_mime_type(file_content, allowed_mime_types):
            errors.append("Invalid file type detected")
        
        # 4. Проверка, что это действительно изображение
        if not await FileValidator.validate_is_image(file_content):
            errors.append("File is not a valid image")
        
        # 5. Проверка размеров
        if not await FileValidator.validate_dimensions(file_content, max_dimensions):
            errors.append(f"Image dimensions exceed {max_dimensions}")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "file_size": len(file_content)
        }