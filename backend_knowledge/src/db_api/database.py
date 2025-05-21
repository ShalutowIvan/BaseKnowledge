from typing import AsyncGenerator

from fastapi import Depends

# from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
# from regusers.models import User

from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
# from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Mapped, mapped_column
from sqlalchemy.pool import NullPool

from sqlalchemy import MetaData, String, Boolean
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

#боевые креды для ДБ
from src.settings import DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER


#ссылка для подключения БД постгре, тестовая и боевая
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


#асинхронный движок create_async_engine
engine = create_async_engine(DATABASE_URL, poolclass=NullPool, echo=True)#echo нужен для записи логово в консоли от запросов sql

#на сайте metanit.com пишут что DeclarativeBase это более новая версия указания декларативной базы, с помощью функции это устаревший формат и если класс прописать, можно в классе настройки свои прописать
class Base(DeclarativeBase):
    pass

# Base = declarative_base()


#это асинхронная сессия БД
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
# autoflush=False,



#это функция для асинхронного запуска. Как к ней делать запросы пока не знаю. 
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
        





