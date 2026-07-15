import os
import sys
from logging.config import fileConfig
from sqlalchemy import pool
from alembic import context

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from settings import DB_HOST, DB_PORT, DB_PASS, DB_USER, DB_NAME

import asyncio
# Заменили async_engine_from_config на универсальный create_async_engine
from sqlalchemy.ext.asyncio import create_async_engine 
from dotenv import load_dotenv

# импорт класса Base декларативной модели
from db_api import Base

# импорты моделей из папок с роутами по разделам
from routers_api.regusers.models import *
from routers_api.knowledge.models import *
from routers_api.projects.models import *
from routers_api.roadmap.models import *

load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

DATABASE_URL = os.getenv("DATABASE_URL")

# Формируем итоговую строку подключения
if DATABASE_URL:
    # Для Amvera (берется готовая строка)
    target_url = DATABASE_URL
else:
    # Для локальной разработки (собирается из ваших настроек settings.py)
    # ВАЖНО: убедитесь, что здесь используется префикс +asyncpg
    target_url = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Записываем итоговый URL в конфигурацию Alembic
config.set_main_option("sqlalchemy.url", target_url)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Запуск миграций в 'offline' режиме."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    """Синхронная функция, выполняемая внутри асинхронного соединения"""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Асинхронный запуск миграций в 'online' режиме."""
    # Создаем движок напрямую из полученной строки target_url
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        # Запускаем синхронную функцию миграций в асинхронном контексте
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

# Правильный запуск
if context.is_offline_mode():
    run_migrations_offline()
else:
    # Используем asyncio.run для корректного вызова асинхронной функции
    asyncio.run(run_migrations_online())
