# 4. Сервис сжатия изображений (используем Pillow + оптимизации)

from PIL import Image as PILImage, ImageOps
import io
from pathlib import Path

class ImageCompressor:
    @staticmethod
    async def compress_image(
        image_content: bytes,
        quality: int = 85,
        max_dimensions: tuple = None,
        output_format: str = "WEBP"  # Используем WebP как оптимальный формат
    ) -> bytes:
        """
        Сжатие изображения с сохранением качества
        WebP дает лучшее сжатие чем JPEG/PNG
        """
        try:
            # Открываем изображение
            image = PILImage.open(io.BytesIO(image_content))
            
            # Сохраняем ориентацию
            image = ImageOps.exif_transpose(image)
            
            # Конвертируем в RGB если нужно
            if image.mode in ('RGBA', 'P'):
                # Создаем белый фон для прозрачных изображений
                background = PILImage.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image, (0, 0))
                image = background
            elif image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')
            
            # Изменяем размер если нужно
            if max_dimensions:
                image.thumbnail(max_dimensions, PILImage.Resampling.LANCZOS)
            
            # Сохраняем в оптимальном формате
            output_buffer = io.BytesIO()
            
            if output_format.upper() == 'WEBP':
                # WebP с lossy сжатием для лучшего размера
                image.save(
                    output_buffer,
                    format='WEBP',
                    quality=quality,
                    method=6  # Максимальное качество сжатия
                )
            elif output_format.upper() == 'JPEG':
                image.save(
                    output_buffer,
                    format='JPEG',
                    quality=quality,
                    optimize=True,
                    progressive=True
                )
            else:
                image.save(output_buffer, format=output_format, optimize=True)
            
            compressed_content = output_buffer.getvalue()
            
            # Если сжатый файл больше оригинала, возвращаем оригинал
            if len(compressed_content) >= len(image_content):
                return image_content
            
            return compressed_content
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Image compression failed: {str(e)}"
            )
    
    @staticmethod
    async def create_thumbnail(
        image_content: bytes,
        size: tuple = (400, 400)
    ) -> bytes:
        """Создание превью изображения"""
        try:
            image = PILImage.open(io.BytesIO(image_content))
            image = ImageOps.exif_transpose(image)
            
            # Конвертируем в RGB если нужно
            if image.mode in ('RGBA', 'P'):
                background = PILImage.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image, (0, 0))
                image = background
            elif image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')
            
            # Создаем thumbnail с сохранением пропорций
            image.thumbnail(size, PILImage.Resampling.LANCZOS)
            
            output_buffer = io.BytesIO()
            image.save(output_buffer, format='WEBP', quality=75, method=4)
            
            return output_buffer.getvalue()
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Thumbnail creation failed: {str(e)}"
            )
    
    @staticmethod
    async def get_image_info(image_content: bytes) -> dict:
        """Получение информации об изображении"""
        try:
            image = PILImage.open(io.BytesIO(image_content))
            return {
                "format": image.format,
                "mode": image.mode,
                "size": image.size,
                "width": image.width,
                "height": image.height
            }
        except Exception:
            return {}