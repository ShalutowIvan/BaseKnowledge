from fastapi import HTTPException, Request
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from .models import *
from .schemas import *
# from main import UPLOAD_FOLDER
import os
import uuid
import aiofiles
from transliterate import translit

# для знаний
############################################################
UPLOAD_FOLDER = "uploads"

#создание группы
async def group_create_service(db: AsyncSession, group: GroupShema) -> GroupShemaFull:
    # Создаем новую группу    
    slug = translit(group.name_group, language_code='ru', reversed=True)    
    new_group = Group(name_group=group.name_group, slug=slug)
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group


async def get_knowledge(db: AsyncSession, knowledge_id: int) -> KnowledgesSchemaFull | None:
    # Получаем пост с подгрузкой связанных изображений
    result = await db.execute(
        select(Knowledges)
        .where(Knowledges.id == knowledge_id)
        .options(selectinload(Knowledges.images))
    )
    return result.scalars().first()


async def knowledges_create_service(db: AsyncSession, knowledge: KnowledgesCreateSchema) -> KnowledgesSchemaFull:
    # Создаем новое знание
    fake_user = 1
    slug = translit(knowledge.title, language_code='ru', reversed=True)    
    new_knowledge = Knowledges(title=knowledge.title, description=knowledge.description, group_id=knowledge.group, slug=slug, user_id=fake_user)
    db.add(new_knowledge)
    await db.commit()
    await db.refresh(new_knowledge)
    return new_knowledge



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


# изображения начало тут!!!!
#для добавления записи об изображении в БД
async def add_record_image_in_base(db: AsyncSession, filename: str, filepath: str, post_id: int | None = None) -> ImageSchema:
    # Создаем запись об изображении в БД
    db_image = Images(
        filename=filename,
        filepath=filepath,
        post_id=post_id
    )
    db.add(db_image)
    await db.commit()
    await db.refresh(db_image)
    return db_image



#функции для загрузки файла фото
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

# вторая функция тоже относится к загрузке файла фото
async def upload_image_service(request, file, db: AsyncSession):
    try:
        # 1. Сохраняем файл на сервере
        filename, filepath = await save_uploaded_file(file, UPLOAD_FOLDER)
        
        # 2. Формируем полный URL
        base_url = str(request.base_url)  # Получаем базовый URL сервера
        # print("тут базовый урл при загрузке изображения")
        # print(base_url)
        image_url = f"{base_url}uploads/{filename}".replace("//uploads", "/uploads")
        
        # 3. Создаем запись в БД (сохраняем относительный путь)
        db_image = await add_record_image_in_base(
            db=db,
            filename=filename,
            filepath=f"/uploads/{filename}"  # Сохраняем относительный путь
        )
        
        # 4. Возвращаем ответ с полным URL
        return {
            "id": db_image.id,
            "filename": db_image.filename,
            "url": image_url,  # Полный URL для клиента
            "created_at": db_image.created_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )



#удаление картинки по ссылке из БД и файл с сервера
async def delete_image_by_url(db: AsyncSession, image_url: str) -> bool:
    # 1. Извлекаем имя файла из URL
    filename = image_url.split('/')[-1]
    
    # 2. Удаляем запись из БД
    result = await db.execute(
        delete(Images)
        .where(Images.filename == filename)
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


# удаление знания и изображений в нем. УРЛ в роутах еще не сделал
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


