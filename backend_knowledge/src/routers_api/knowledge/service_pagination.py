from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import math
from .models import Knowledge
from .schemas import PaginatedResponse


class Repository_pagination:
    @staticmethod
    async def get_items_paginated(
        session: AsyncSession,
        page: int = 1,
        per_page: int = 20
    ) -> PaginatedResponse:
        """
        Получает пагинированный список элементов из базы данных
        """
        # Шаг 1: Вычисляем смещение для SQL запроса
        offset = (page - 1) * per_page
        
        # Шаг 2: Запрос для получения элементов текущей страницы
        # ORDER BY обязателен для стабильной пагинации
        items_query = select(Item).order_by(Item.id).limit(per_page).offset(offset)
        items_result = await session.execute(items_query)
        items = items_result.scalars().all()
        
        # Шаг 3: Запрос общего количества элементов в таблице
        count_result = await session.execute(select(func.count(Item.id)))
        total_count = count_result.scalar()
        
        # Шаг 4: Вычисляем общее количество страниц
        total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1
        
        # Шаг 5: Получаем ID первого и последнего элемента на странице
        first_item = items[0].id if items else None
        last_item = items[-1].id if items else None
        
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