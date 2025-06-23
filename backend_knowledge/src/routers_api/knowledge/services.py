from fastapi import HTTPException, Request, UploadFile, File, Body
from fastapi.responses import FileResponse
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload, joinedload, load_only
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from .models import *
from .schemas import *
# from main import UPLOAD_FOLDER
import os
import uuid
import aiofiles
import re
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


#получение списка групп
async def get_group_service(db: AsyncSession) -> GroupShemaFull:
    query = await db.execute(select(Group))
    groups = query.scalars().all()
    
    # query = select(Group)
    # groups = await db.scalars(query)
    return groups


# получение одного знания по ИД. Используется в других функциях
async def get_knowledge(db: AsyncSession, knowledge_id: int) -> KnowledgesSchemaFull | None:
    # Получаем пост с подгрузкой связанных изображений
    result = await db.execute(
        select(Knowledges)
        .options(selectinload(Knowledges.images))
        .where(Knowledges.id == knowledge_id)        
    )
    return result.scalar()


async def knowledges_create_service(db: AsyncSession, knowledge: KnowledgesCreateSchema) -> KnowledgesSchemaFull:
    # Создаем новое знание
    fake_user = 1
    slug = translit(knowledge.title, language_code='ru', reversed=True)    
    new_knowledge = Knowledges(title=knowledge.title, description=knowledge.description, group_id=knowledge.group_id, slug=slug, user_id=fake_user)
    db.add(new_knowledge)
    await db.commit()
    await db.refresh(new_knowledge)
    return new_knowledge



# Получаем список знаний с пагинацией
# async def get_knowledges(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[KnowledgesSchemaFull]:
    # result = await db.execute(
    #     select(Post)
    #     .offset(skip)
    #     .limit(limit)
    #     .options(selectinload(Post.images))
    #     .order_by(Post.created_at.desc())
    # )
    # return result.scalars().all()

# получение всех знаний, пока без пагинации
async def get_knowledges(db: AsyncSession) -> list[KnowledgesSchema]:
    knowledges = await db.execute(select(Knowledges).order_by(Knowledges.created_at.desc()))    
    return knowledges.scalars().all()
    

#получение знаний по фильтру группы
async def get_knowledges_in_group(db: AsyncSession, slug) -> list[KnowledgesSchema]:    
    query = select(Knowledges.title, Knowledges.description, Knowledges.id).join(Knowledges.group).where(Group.slug == slug)        
    knowledges_gr = await db.execute(query)
    return knowledges_gr.all()
# scalars().

# открыть знание
async def knowledges_open_service(db: AsyncSession, kn_id: int):    
    query = select(Knowledges).options(selectinload(Knowledges.images), selectinload(Knowledges.group)).where(Knowledges.id == kn_id)
    
    knowledge = await db.execute(query)
    
    return knowledge.scalar()


# для изображений

# изображения начало тут!!!!
#для добавления записи об изображении в БД
async def add_record_image_in_base(db: AsyncSession, filename: str, filepath: str, knowledge_id: int) -> ImageSchema:
    # Создаем запись об изображении в БД
    db_image = Images(
        filename=filename,
        filepath=filepath,
        knowledge_id=knowledge_id
    )
    db.add(db_image)
    await db.commit()
    await db.refresh(db_image)
    return db_image



#функции для загрузки файла фото. Берем папку с сервера, потом делаем расширение файла и название файла, и склеиваем папку и имя файла с расширением. Далее загружаем файл асинхронно. Другими словами грузим файл тут!
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



# файл фото грузится, но  фронт выдает ошибку. Пока не понял почему, разбирать функцию надо... может и на фронте проблема. Ошибка не выдается, но файл не грузится на сервер, а ссылка в посте сохраняется....

# вторая функция тоже относится к загрузке файла фото. Тут вроде бы все готово
async def upload_image_service(request: Request, knowledge_id: int, db: AsyncSession, file: UploadFile = File(...)):
    try:

        # 1. Сохраняем файл на сервере
        filename, filepath = await save_uploaded_file(file=file, upload_dir=UPLOAD_FOLDER)
        
        # 2. Формируем полный URL
        base_url = str(request.base_url)  # Получаем базовый URL сервера
        # print("тут базовый урл при загрузке изображения")
        # print(base_url)
        image_url = f"{base_url}uploads/{filename}".replace("//uploads", "/uploads")#это полный урл фото. Тут мы почему-то не используем полученный ранее filepath, а делаем такой путь повторно.
        
        # 3. Создаем запись в БД (сохраняем относительный путь)
        db_image = await add_record_image_in_base(
            db=db,
            filename=filename,
            filepath=f"/uploads/{filename}", # Сохраняем относительный путь
            knowledge_id=knowledge_id
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


#функция для возврата ссылки на файл изображения
async def view_file_image_service(file_name: str):
    file_path = os.path.join(UPLOAD_FOLDER, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


#удаление картинки по ссылке из БД и файл с сервера
async def delete_image_by_url(db: AsyncSession, image_url: str) -> bool:
    print("идет удаление, такую ссылку получили!!!!!!!!!!!!!!!", image_url)
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



# сравнить с функцией выше. knowledge_update тут фул знание скорее всего. Но если что сделать отдельную схему в питоне для обновления знания
async def update_knowledge_service(request: Request, knowledge_id: int, knowledge_update: KnowledgesUpdateSchema, db: AsyncSession):
    # 1. Получаем текущий знание с изображениями
    db_knowledge = await get_knowledge(db=db, knowledge_id=knowledge_id)
    if not db_knowledge:
        raise HTTPException(status_code=404, detail="knowledge not found")

    # 2. Анализируем изображения
    if db_knowledge.images != None:
        base_url = str(request.base_url)[:-1]
        old_images = {f'{base_url}{img.filepath}' for img in db_knowledge.images}        
        new_images = set(re.findall(r'!\[.*?\]\((.*?)\)', knowledge_update.content))
        
        # 3. Удаляем отсутствующие изображения
        images_to_delete = old_images - new_images
        for url in images_to_delete:
            if url.startswith(base_url + '/uploads/'):  # Удаляем локальные файлы по ссылкам которые начинаются с текста base_url + '/uploads/'
                await delete_image_by_url(db=db, image_url=url)

    # 4. Добавляем новые изображения в БД
    # for url in new_images - old_images:
    #     if url.startswith('/uploads/'):
    #         filename = url.split('/')[-1]
    #         await upload_image_service(db, filename, post_id)#!!!!!!!!!!!!!! ост тут assign_to_post. Это скорее всего не нужно, так как у нас идет автоматическая загрузка на сервер при вставке изображения в посте. Как я понял тут файл не загрузится, так как он автоматом грузится при вставке, и тут мы файл передать не сможем. Это пока не надо

    # 5. Обновляем пост
    db_knowledge.updated_at = datetime.utcnow()
    # db_knowledge.title = knowledge_update.title
    db_knowledge.content = knowledge_update.content
    await db.commit()
    await db.refresh(db_knowledge)
    
    return db_knowledge


# удаление знания и изображений в нем. 
async def delete_knowledge_service(db: AsyncSession, knowledge_id: int) -> bool:    
    try:
        # 1. Получаем знание с изображениями
        knowledge = await get_knowledge(db, knowledge_id)
        if not knowledge:
            return False

        # 2. Удаляем файлы связанных изображений
        for image in knowledge.images:
            filepath = os.path.join(UPLOAD_FOLDER, image.filename)
            if os.path.exists(filepath):
                os.unlink(filepath)
        
        # 3. Удаляем само знание. Удаляется и знание и связанное поле изображения каскадно. 
        await db.delete(knowledge)
        
        await db.commit()
        return True

    except Exception as ex:
        print("Ошибка при удалении знания:", ex)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при удалении знания: {str(e)}"
        )


async def update_knowledge_header_service(knowledge_id: int, knowledge_update: KnowledgesUpdateHeaderSchema, db: AsyncSession):
    # 1. Получаем текущее знание 5-ю полями. А с фронта принимаем 3 поля. Включая связанное поле. И возвращаем ответ со связанным полем
    query = (select(Knowledges).where(Knowledges.id == knowledge_id).options(
                selectinload(Knowledges.group),
                load_only(
                Knowledges.title,
                Knowledges.description,
                Knowledges.slug,
                Knowledges.free_access,
                Knowledges.updated_at,
                Knowledges.group_id
                )
            ))    
    result = await db.execute(query)
    knowledge_header = result.scalar_one_or_none()

    if not knowledge_header:
        raise HTTPException(status_code=404, detail="knowledge not found")
    
    # # 2. Обновляем знание
    knowledge_header.title = knowledge_update.title
    knowledge_header.description = knowledge_update.description
    knowledge_header.free_access = knowledge_update.free_access
    knowledge_header.slug = translit(knowledge_update.title, language_code='ru', reversed=True)
    knowledge_header.group_id = knowledge_update.group_id    
    knowledge_header.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(knowledge_header)
    
    # возвращаем все 5 полей. Если название знания изменить, то выкинет в список знаний
    return knowledge_header



# async def delete_group_service(db: AsyncSession, group_id: int) -> bool:    
#     try:        
#         query = await db.execute(select(Group).where(Group.id == group_id))

#         group = query.scalar()

#         if not group:            
#             return False
                    
#         await db.delete(group)        
#         await db.commit()
#         return True

#     except Exception as ex:
#         print("Ошибка при удалении группы:", ex)
#         raise HTTPException(
#             status_code=500,
#             detail=f"Ошибка при удалении группы: {str(e)}"
#         )





# Body - наверно схема, прописать... ост туту
async def delete_group_service(group_id: int, db: AsyncSession, move_to_group):
    
    # move_to_group = move_to_group.get("move_to_group")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print(move_to_group)

    # Проверяем существование группы
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Если указана группа для переноса - проверяем её
    if move_to_group:
        target_group = await db.get(Group, move_to_group)
        if not target_group:
            raise HTTPException(status_code=400, detail="Target group not found")
        
        # Переносим знания
        await db.execute(
            update(Knowledges)
            .where(Knowledges.group_id == group_id)
            .values(group_id=move_to_group)
        )
    
    # Удаляем группу
    await db.delete(group)
    await db.commit()
    
    return {"status": "success"}



