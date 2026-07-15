#!/bin/sh
# Автоматический запуск миграций при деплое
alembic upgrade head

# Запуск FastAPI на порту 8000 (внутренний порт Amvera)
exec uvicorn main:app --host 0.0.0.0 --port 8000
