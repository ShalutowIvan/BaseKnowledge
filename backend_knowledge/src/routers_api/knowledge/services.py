from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from .models import *
from .schemas import *
from main import UPLOAD_FOLDER
import os
import uuid
import aiofiles


# для знаний
############################################################

async def get_knowledge(db: AsyncSession, knowledge_id: int) -> KnowledgesSchemaFull | None:
    # Получаем пост с подгрузкой связанных изображений
    result = await db.execute(
        select(Knowledges)
        .where(Knowledges.id == knowledge_id)
        .options(selectinload(Knowledges.images))
    )
    return result.scalars().first()


# async def get_knowledges(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[KnowledgesSchemaFull]:
#     # Получаем список постов с пагинацией
#     result = await db.execute(
#         select(Post)
#         .offset(skip)
#         .limit(limit)
#         .options(selectinload(Post.images))
#         .order_by(Post.created_at.desc())
#     )
#     return result.scalars().all()

# async def create_knowledge(db: AsyncSession, post: schemas.PostCreate) -> KnowledgesSchemaFull:
#     # Создаем новый пост
#     db_post = Post(**post.model_dump())
#     db.add(db_post)
#     await db.commit()
#     await db.refresh(db_post)
#     return db_post



# async def delete_knowledge(db: AsyncSession, post_id: int) -> bool:
#     # Удаляем пост и возвращаем статус операции
#     result = await db.execute(
#         delete(Post)
#         .where(Post.id == post_id)
#     )
#     await db.commit()
#     return result.rowcount > 0


# для изображений

# получение изображения
# async def get_image(db: AsyncSession, image_id: int) -> schemas.Image | None:
#     # Получаем информацию об изображении
#     result = await db.execute(
#         select(Image)
#         .where(Image.id == image_id)
#     )
#     return result.scalars().first()


#функция для загрузки файла фото
async def save_uploaded_file(file, upload_dir: str) -> tuple[str, str]:
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join(upload_dir, filename)
    
    #использую тут библиотеку aiofiles, можно и без нее, но с ней лучше
    async with aiofiles.open(filepath, "wb") as buffer:
        await buffer.write(await file.read())

    # # Асинхронное сохранение файла. Вариант без aiofiles
    # contents = await file.read()
    # with open(filepath, "wb") as buffer:
    #     buffer.write(contents)
    
    return filename, filepath


#для добавления записи об изображении в БД
async def add_record_image_in_base(db: AsyncSession, filename: str, filepath: str, post_id: int | None = None) -> ImageSchema:
    # Создаем запись об изображении в БД
    db_image = Image(
        filename=filename,
        filepath=filepath,
        post_id=post_id
    )
    db.add(db_image)
    await db.commit()
    await db.refresh(db_image)
    return db_image


#удаление картинки по ссылке из БД и файл с сервера
async def delete_image_by_url(db: AsyncSession, image_url: str) -> bool:
    # 1. Извлекаем имя файла из URL
    filename = image_url.split('/')[-1]
    
    # 2. Удаляем запись из БД
    result = await db.execute(
        delete(Image)
        .where(Image.filename == filename)
    )
    
    # 3. Удаляем файл с диска
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        os.unlink(filepath)
    
    await db.commit()
    return result.rowcount > 0


#функция для редактирования знания. 
async def update_knowledge(
    db: AsyncSession,
    knowledge_id: int,
    knowledge: KnowledgesCreateSchema,
    current_images: list[str] = None  # Принимаем текущие изображения
) -> KnowledgesSchemaFull | None:
    # 1. Получаем текущий пост с изображениями
    db_knowledge = await get_knowledge(db, knowledge_id)
    if not db_knowledge:
        return None

    # 2. Анализируем Markdown-контент для поиска изображений
    import re
    current_content_images = re.findall(r'\!\[.*?\]\((.*?)\)', knowledge.content)

    # 3. Находим изображения для удаления (есть в БД, но нет в новом контенте)
    images_to_delete = [
        img for img in current_images 
        if img not in current_content_images
    ]

    # 4. Удаляем изображения
    for image_url in images_to_delete:
        await delete_image_by_url(db, image_url)

    # 5. Обновляем пост
    db_knowledge.title = knowledge.title
    db_knowledge.content = knowledge.content
    db_knowledge.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_knowledge)
    return db_knowledge


# удаление знания и изображений в нем
async def delete_knowledge(db: AsyncSession, knowledge_id: int) -> bool:
    # 1. Получаем пост с изображениями
    knowledge = await get_knowledge(db, knowledge_id)
    if not knowledge:
        return False

    # 2. Удаляем связанные изображения
    for image in knowledge.images:
        filepath = os.path.join(UPLOAD_FOLDER, image.filename)
        if os.path.exists(filepath):
            os.unlink(filepath)
    
    # 3. Удаляем сам пост
    await db.execute(
        delete(Knowledges)
        .where(Knowledges.id == knowledge_id)
    )
    
    await db.commit()
    return True


