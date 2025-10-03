from fastapi import HTTPException, Request, UploadFile, File, Body, status
from fastapi.responses import FileResponse
from sqlalchemy import select, update, delete, func
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

from routers_api.regusers.verify_user import verify_user_service
from routers_api.regusers.models import User
from db_api.database import logger
import math


# для знаний
############################################################
UPLOAD_FOLDER = "uploads"

#создание группы
async def group_create_service(user_id: int, db: AsyncSession, group: GroupShema) -> GroupShemaFull:
    # Создаем новую группу    
    slug = translit(group.name_group, language_code='ru', reversed=True)    
    new_group = Group(name_group=group.name_group, slug=slug, user_id=user_id)
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group


#получение списка групп
async def groups_all_service(user_id: int, db: AsyncSession) -> GroupShemaFull:
    query = await db.execute(select(Group).where(Group.user_id == user_id))
    groups = query.scalars().all()    
    return groups


# изменение имени группы
async def group_name_update_service(user_id: int, group_id: int, group_name_update: GroupShema, db: AsyncSession):    
    try:
        # 1. Получаем поля группы
        query = select(Group).where(Group.id == group_id).where(Group.user_id == user_id).options(
                    load_only(
                    Group.id,
                    Group.name_group,
                    Group.slug,                    
                    )
                )
        result = await db.execute(query)
        group_name = result.scalar_one_or_none()

        if not group_name:            
            # logger.warning(f"Stage not found - user_id: {user_id}, stage_id: {stage_id}")
            raise HTTPException(status_code=404, detail="group not found")
        
        # 2. Обновляем группу
        slug = translit(group_name_update.name_group, language_code='ru', reversed=True)

        group_name.name_group = group_name_update.name_group
        group_name.slug = slug        
        await db.commit()
        await db.refresh(group_name)
        
        logger.info(f"Stage updated successfully - user_id: {user_id}, stage_id: {group_id}")
        # возвращаем все 3 поля.
        return group_name

    except Exception as ex:        
        raise ex


# получение одного знания по ИД. Используется в других функциях
async def get_knowledge(db: AsyncSession, knowledge_id: int) -> KnowledgesSchemaFull | None:
    # Получаем пост с подгрузкой связанных изображений
    result = await db.execute(
        select(Knowledge)
        .options(selectinload(Knowledge.images))
        .where(Knowledge.id == knowledge_id)        
    )
    return result.scalar()


async def knowledges_create_service(user_id: int, db: AsyncSession, knowledge: KnowledgesCreateSchema) -> KnowledgesSchemaFull:
    slug = translit(knowledge.title, language_code='ru', reversed=True)    
    new_knowledge = Knowledge(title=knowledge.title, description=knowledge.description, group_id=knowledge.group_id, slug=slug, user_id=user_id)
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
async def knowledges_all_service(user_id: int, db: AsyncSession) -> list[KnowledgesSchema]:
    query = select(Knowledge).where(Knowledge.user_id == user_id).order_by(Knowledge.created_at.desc())
    knowledges = await db.execute(query)
    return knowledges.scalars().all()
    

# это код запросов без пагинации для фильтра группы
    # if slug == "all":
    #     query_all = select(Knowledge).where(Knowledge.user_id == user_id).order_by(Knowledge.created_at.desc())
    #     knowledges_all = await db.execute(query_all)
    #     return knowledges_all.scalars().all()

    # query = select(Knowledge.title, Knowledge.description, Knowledge.id).join(Knowledge.group).where(Group.slug == slug).where(Knowledge.user_id == user_id)
    # knowledges_gr = await db.execute(query)

    # return knowledges_gr.all()


# полнотекстовый поиск жесть.... там сначала формируется поиск с параметром как сырой sql, а потом указывается параметр для него из формы запроса с фронта. 

# вопрос дипсику:
# Вопросы есть. 
# В чем отличие этой записи в модели:
# search_vector = Column(
#         TSVECTOR,
#         Computed(
#             "to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))",
#             persisted=True
#         )
#     )
# От этой:
# search_vector: Mapped[TSVECTOR] = mapped_column(TSVECTOR, nullable=True)

# Какую лучше и выгоднее использовать?

# После добавления вектора в модель можно ли использовать обычные alembic миграции? Или как я должен выполнить такие миграции:
# -- В миграции выполните:
# CREATE INDEX idx_knowledge_search_vector 
# ON knowledge USING gin(search_vector);

# -- Опционально: индекс для русского языка с учетом морфологии
# CREATE INDEX idx_knowledge_search_vector_ru 
# ON knowledge USING gin(to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')));


# Ранжирование. Откуда берется ранжирование? Его надо где-то прописывать? 
# data_query = data_query.add_columns(
#                     text("ts_rank_cd(knowledge.search_vector, plainto_tsquery('russian', :search)) as search_score")
# Не понятно откуда тут берется ранжирование? Его же здесь не прописали? Не указаны поля из модели тут. 
# Или ранжирование будет указывается когда мы возвращаем объекты с релевантностью циклом? 






#получение знаний по фильтру группы с пагинацией без поиска
# async def knowledges_in_group_service(
#     user_id: int, 
#     db: AsyncSession, 
#     slug: str, 
#     page: int = 1, 
#     per_page: int = 20) -> PaginatedResponse:
#     try:

#         if page < 0 or per_page < 0:
#             raise HTTPException(
#                 status_code=403,
#                 detail=f"Значения {page} или {per_page} не может быть отрицательным."
#             )

#         """
#         Получает пагинированный список элементов из базы данных
#         """
#         # Шаг 1: Вычисляем смещение для SQL запроса
#         offset = (page - 1) * per_page
        
#         # Шаг 2: Запрос для получения элементов текущей страницы
#         # ORDER BY обязателен для стабильной пагинации    
        
#         # формируем запросы
#         # условие все группы или есть фильтр
#         if slug == "all":
#             data_query = (
#                 select(Knowledge.id, Knowledge.title, Knowledge.description)
#                 .where(Knowledge.user_id == user_id)
#                 .order_by(Knowledge.created_at.desc())
#                 .limit(per_page).offset(offset)
#                 )            
#             count_query = (
#                 select(func.count(Knowledge.id))
#                 .where(Knowledge.user_id == user_id)
#                 )
#         else:
#             data_query = (
#                 select(Knowledge.id, Knowledge.title, Knowledge.description)
#                 .join(Knowledge.group)
#                 .where(Group.slug == slug)
#                 .where(Knowledge.user_id == user_id)
#                 .order_by(Knowledge.created_at.desc())
#                 .limit(per_page).offset(offset)
#                 )
#             count_query = (
#                 select(func.count(Knowledge.id))
#                 .join(Knowledge.group)
#                 .where(Group.slug == slug)
#                 .where(Knowledge.user_id == user_id)
#                 )
        
#         # выполняем запросы
#         data_result = await db.execute(data_query)
        
#         count_result = await db.execute(count_query)

#         # или так параллельно: 
#         # data_result, count_result = await asyncio.gather(
#         #     db.execute(data_query),
#         #     db.execute(count_query)
#         # )

#         items = data_result.all()
                
#         total_count = count_result.scalar()
        
#         # Шаг 4: Вычисляем общее количество страниц
#         total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1

#         if page > total_pages and total_pages > 0:
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"Страница {page} не найдена. Всего страниц: {total_pages}"
#             )
        
#         # Шаг 5: Получаем ID первого и последнего элемента на странице
#         first_item = items[0].id if items else None
#         last_item = items[-1].id if items else None
        
#         # Шаг 6: Проверяем наличие следующей и предыдущей страниц
#         has_next = page < total_pages
#         has_prev = page > 1

#         # Проверяем, существует ли запрашиваемая страница
        

#         return PaginatedResponse(
#                 items=items,
#                 total=total_count,
#                 page=page,
#                 per_page=per_page,
#                 total_pages=total_pages,
#                 has_next=has_next,
#                 has_prev=has_prev,
#                 first_item=first_item,
#                 last_item=last_item
#             )
    
#     except HTTPException:        
#         raise

#     except Exception as ex:
#         # Логируем ошибку и возвращаем пользователю
#         raise HTTPException(
#             status_code=500, 
#             detail="Ошибка при получении данных"
#         )


async def knowledges_in_group_service(
    user_id: int, 
    db: AsyncSession, 
    slug: str, 
    search: str = None,
    search_type: str = "plain",  # plain, phrase, advanced
    use_fts: bool = True,
    page: int = 1, 
    per_page: int = 20) -> PaginatedResponse:
    try:

        if page < 1 or per_page < 1:
            raise HTTPException(
                status_code=403,
                detail="Номер страницы и размер страницы должны быть положительными числами"
            )

        if per_page > 100:
            raise HTTPException(
                status_code=400, 
                detail="Размер страницы не может превышать 100"
            )

        """
        Получает пагинированный список элементов из базы данных
        """
        # Шаг 1: Вычисляем смещение для SQL запроса
        offset = (page - 1) * per_page
        
        # Базовые запросы
        data_query = select(
            Knowledge.id, 
            Knowledge.title, 
            Knowledge.description,
            Knowledge.created_at
        ).where(Knowledge.user_id == user_id)

        count_query = select(func.count(Knowledge.id)).where(Knowledge.user_id == user_id)

        # Фильтр по группе
        if slug != "all":
            data_query = data_query.join(Knowledge.group).where(Group.slug == slug)
            count_query = count_query.join(Knowledge.group).where(Group.slug == slug)


        # ОБРАБОТКА ПОИСКА
        if search and search.strip():
            search_cleaned = search.strip()
            
            if use_fts:
                # 🔥 ПОЛНОТЕКСТОВЫЙ ПОИСК с использованием весов из модели
                
                # Создаем условие поиска в зависимости от типа
                if search_type == "phrase":
                    search_condition = text("knowledge.search_vector @@ phraseto_tsquery('simple', :search)")
                elif search_type == "advanced":
                    search_condition = text("knowledge.search_vector @@ to_tsquery('simple', :search)")
                else:  # plain
                    search_condition = text("knowledge.search_vector @@ plainto_tsquery('simple', :search)")


                # 🔥 РАНЖИРОВАНИЕ с использованием ТОЧНО ТАКИХ ЖЕ ВЕСОВ как в модели
                rank_expression = text("""
                    ts_rank_cd(
                        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
                        setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
                        setweight(to_tsvector('simple', coalesce(content, '')), 'C'),
                        plainto_tsquery('simple', :search)
                    ) as search_score
                """)

                # Применяем условие поиска и ранжирование
                data_query = (
                    data_query
                    .where(search_condition)
                    # .add_columns(rank_expression)  # Добавляем score в SELECT
                    # .order_by(text("search_score DESC"), Knowledge.created_at.desc())
                    .order_by(Knowledge.created_at.desc())
                    .params(search=search_cleaned)
                )

                count_query = count_query.where(search_condition).params(search=search_cleaned)
                
            else:
                # Резервный вариант: LIKE поиск (медленный)
                search_term = f"%{search_cleaned}%"
                search_condition = or_(
                    Knowledge.title.ilike(search_term),
                    Knowledge.description.ilike(search_term),
                    Knowledge.content.ilike(search_term)
                )
                data_query = data_query.where(search_condition)
                count_query = count_query.where(search_condition)
                data_query = data_query.order_by(Knowledge.created_at.desc())
        else:
            # Без поиска - обычная сортировка
            data_query = data_query.order_by(Knowledge.created_at.desc())

        # Применяем пагинацию к основному запросу
        data_query = data_query.limit(per_page).offset(offset)


        
        # выполняем запросы
        data_result = await db.execute(data_query)
        
        count_result = await db.execute(count_query)

        # или так параллельно: 
        # data_result, count_result = await asyncio.gather(
        #     db.execute(data_query),
        #     db.execute(count_query)
        # )

        items_data = data_result.all()
                
        total_count = count_result.scalar()
            
        
        # ОБРАБОТКА РЕЗУЛЬТАТОВ
        if use_fts and search and search.strip():
            # Для FTS возвращаем объекты с релевантностью
            processed_items = []
            for item in items_data:
                # Структура: (id, title, description, created_at, search_score)
                knowledge_data = {
                    "id": item[0],
                    "title": item[1],
                    "description": item[2],
                    "created_at": item[3],
                    # "relevance_score": float(item[4]) if item[4] is not None else 0.0
                }
                processed_items.append(knowledge_data)
            items = processed_items
        else:
            # Обычные результаты без релевантности
            items = [
                {
                    "id": item[0],
                    "title": item[1], 
                    "description": item[2],
                    "created_at": item[3]
                } 
                for item in items_data
            ]


        # Шаг 4: Вычисляем общее количество страниц
        total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1

        # Проверка существования страницы
        if page > total_pages and total_pages > 0:
            raise HTTPException(
                status_code=404,
                detail=f"Страница {page} не найдена. Всего страниц: {total_pages}"
            )
        
        print("ПРОВЕРКА: ", items)
        # Шаг 5: Получаем ID первого и последнего элемента на странице
        first_item = items[0]["id"] if items else None
        last_item = items[-1]["id"] if items else None
        
        # Шаг 6: Проверяем наличие следующей и предыдущей страниц
        has_next = page < total_pages
        has_prev = page > 1

        
        return PaginatedResponse(
                items=items,
                total=total_count,
                page=page,
                per_page=per_page,
                total_pages=total_pages,
                has_next=has_next,
                has_prev=has_prev,
                first_item=first_item,
                last_item=last_item
            )
    
    except HTTPException:        
        raise

    except Exception as ex:
        # Логируем ошибку и возвращаем пользователю
        print(f"Ошибка в knowledges_in_group_service: {str(ex)}")
        raise HTTPException(
            status_code=500, 
            detail="Ошибка при получении данных"
        )




# открыть знание
async def knowledges_open_service(user_id: int, kn_id: int, db: AsyncSession):    
    query = select(Knowledge).options(selectinload(Knowledge.images), selectinload(Knowledge.group)).where(Knowledge.id == kn_id).where(Knowledge.user_id == user_id)
    
    knowledge = await db.execute(query)
    
    return knowledge.scalar()





# открыть знание - свободный доступ, не проверяется пользователь
async def knowledges_open_free_service(slug: str, db: AsyncSession):    
    try:
        query = await db.execute(select(Knowledge).options(selectinload(Knowledge.images), selectinload(Knowledge.group)).where(Knowledge.slug == slug))
        knowledge = query.scalar()
        if knowledge.free_access == False:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Error: free access denied")
        
        return knowledge
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge not found!")            

# для изображений

# изображения начало тут!!!!
#для добавления записи об изображении в БД
async def add_record_image_in_base(db: AsyncSession, filename: str, filepath: str, knowledge_id: int) -> ImageSchema:
    # Создаем запись об изображении в БД
    db_image = Image(
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
    query = select(Knowledge).where(Knowledge.id == knowledge_id).options(
                selectinload(Knowledge.group),
                load_only(
                Knowledge.title,
                Knowledge.description,
                Knowledge.slug,
                Knowledge.free_access,
                Knowledge.updated_at,
                Knowledge.group_id
                )
            )
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


async def delete_group_service(user_id: int, group_id: int, db: AsyncSession, move_to_group=None):
            
    # Проверяем существование группы
    query = select(Group).where(Group.id == group_id).where(Group.user_id == user_id)    
    result = await db.execute(query)
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Если указана группа для переноса - проверяем её
    if move_to_group:        
        query_move = await db.execute(select(Group).where(Group.id == move_to_group).where(Group.user_id == user_id))
        target_group = query_move.scalar_one_or_none()
        if not target_group:
            raise HTTPException(status_code=400, detail="Target group not found")
        
        # Переносим знания, меняя у них id группы
        await db.execute(
            update(Knowledge)
            .where(Knowledge.group_id == group_id)
            .values(group_id=move_to_group)
        )
    
    # Удаляем группу
    await db.delete(group)
    await db.commit()
    
    return {"status": "success"}









