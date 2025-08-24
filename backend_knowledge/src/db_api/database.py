from typing import AsyncGenerator

# from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
# from regusers.models import User

from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from sqlalchemy.orm import DeclarativeBase
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker, Mapped, mapped_column
from sqlalchemy.pool import NullPool

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# логирование
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
    # logging.FileHandler('test.log')
)

logger = logging.getLogger(__name__)

# Логируем SQL и важные события
# logging.getLogger('sqlalchemy').setLevel(logging.DEBUG)  # SQL-запросы, очень много шума

# Пока включил только логирование SQL
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)  # SQL-запросы
# logging.getLogger('sqlalchemy.pool').setLevel(logging.DEBUG)  # Пул-дебаг режим 


# logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)  # SQL-запросы
# logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)  # Пул (только ошибки)



#боевые креды для ДБ
from settings import DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER


#ссылка для подключения БД постгре, тестовая и боевая
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

#на сайте metanit.com пишут что DeclarativeBase это более новая версия указания декларативной базы, с помощью функции это устаревший формат и если класс прописать, можно в классе настройки свои прописать
class Base(DeclarativeBase):
    pass

#асинхронный движок create_async_engine
# async_engine = create_async_engine(DATABASE_URL, poolclass=NullPool, echo=False)#echo нужен для записи логово в консоли от запросов sql


async_engine = create_async_engine(
    DATABASE_URL,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=10,       # Обычно 5-20% от max_connections БД
    max_overflow=15,    # Дополнительные соединения при нагрузке
    pool_timeout=30,    # Ждать свободного соединения до 30 сек
    pool_recycle=3600,  # Пересоздавать соединения каждый час
    echo=False          # Логировать через logging, а не echo
)


#это асинхронная сессия БД. Поменял здесь sessionmaker на async_sessionmaker
async_session_maker = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
# autoflush=False,



#это функция для асинхронного запуска. 
# async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
#     async with async_session_maker() as session:
#         yield session
        


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            # await session.commit() # Автокоммит при успехе мне не нужен. Я делаю коммит в роутерах
        except Exception:
            await session.rollback() # Автооткат при ошибке
            raise


