# create_database.py
import psycopg2
from psycopg2 import sql

DB_NAME = "ocean_of_memory"
USER = "postgres"
PASSWORD = "YtDktpfq"
HOST = "127.0.0.1"

DB_PORT="5432"

# Подключение к postgres (БД по умолчанию)
conn = psycopg2.connect(
    dbname="postgres",  # Подключаемся к стандартной БД
    user=USER,
    password=PASSWORD,
    host=HOST
)
conn.autocommit = True  # Для создания БД нужен autocommit
cursor = conn.cursor()

# Создаём БД, если её нет
cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_NAME)))
print(f"База данных {DB_NAME} создана!")

cursor.close()
conn.close()