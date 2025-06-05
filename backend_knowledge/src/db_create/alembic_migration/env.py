import os
import sys

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context



# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

#это строка указывает начальную папку из которой будут происходить импорты модулей. В нашем случае мы перешли два раза на каталог выше и импортируем модули. Дальнейшие импорты работают по этому же пути. Скрипт алембика запускает этот файл env.py!
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from settings import DB_HOST, DB_PORT, DB_PASS, DB_USER, DB_NAME

import asyncio
from sqlalchemy.ext.asyncio import async_engine_from_config, AsyncEngine
from dotenv import load_dotenv


#импорт класса Base декларативной модели
from db_api import Base

# импорты моделей из папок с роутами по разделам
from routers_api.regusers.models import *
from routers_api.knowledge.models import *


# sys.path.append(os.path.join(sys.path[0], "src/settings/"))


load_dotenv()


# sys.path.append(os.path.dirname(os.path.dirname(__file__)))
# sys.path.append(str(Path(__file__).parent.parent))
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.

config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# берем ссылку на подключение и секции. Я эту ссылку пока не указывал, но при необходимости можно и указать. Сделал так для базового шаблона файла env.py
DATABASE_URL = os.getenv("DATABASE_URL")#пока убрал эту ссылку из файла env. Но если что тут все прописано. 
section = config.config_ini_section




if DATABASE_URL:
    # Если есть полная строка подключения — используем её
    config.set_main_option("sqlalchemy.url", DATABASE_URL)
else:
    # Иначе — используем параметры и шаблон в alembic.ini
    # config.set_section_option(section, "DB_USER", os.getenv("DB_USER", "postgres"))
    # config.set_section_option(section, "DB_PASS", os.getenv("DB_PASS", ""))
    # config.set_section_option(section, "DB_HOST", os.getenv("DB_HOST", "localhost"))
    # config.set_section_option(section, "DB_PORT", os.getenv("DB_PORT", "5432"))
    # config.set_section_option(section, "DB_NAME", os.getenv("DB_NAME", "mydb"))

    config.set_section_option(section, "DB_HOST", DB_HOST)
    config.set_section_option(section, "DB_PORT", DB_PORT)
    config.set_section_option(section, "DB_PASS", DB_PASS)
    config.set_section_option(section, "DB_USER", DB_USER)
    config.set_section_option(section, "DB_NAME", DB_NAME)



# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

# метаданные из моделей тут пишем
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()



def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# асинхронный вариант run_migrations_online, 2 функции ниже в этом варианте. Это нужно если используем асинк ссылку подключения к БД. Если работаем с секциями, то можно синхронный движок юзать стандартно. 
############################################################################
# def do_run_migrations(connection):
#     """Синхронная функция для запуска миграций"""
#     context.configure(connection=connection, target_metadata=target_metadata)
#     with context.begin_transaction():
#         context.run_migrations()

# async def run_migrations_online():
#     """Асинхронный запуск миграций"""
#     connectable: AsyncEngine = async_engine_from_config(
#         config.get_section(config.config_ini_section),
#         prefix="sqlalchemy.",
#         poolclass=None,
#     )
#     async with connectable.connect() as connection:
#         await connection.run_sync(do_run_migrations)
#     await connectable.dispose()
############################################################################





if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


