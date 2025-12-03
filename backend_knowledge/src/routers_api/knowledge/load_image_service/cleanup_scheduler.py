# 8. Планировщик очистки. Тоже оформить и установить библиотеки нужные
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from services.storage_manager import StorageManager
from database import async_session_maker

def schedule_cleanup():
    """Запуск регулярной очистки по расписанию"""
    scheduler = BackgroundScheduler()
    
    # Каждую ночь в 3:00
    scheduler.add_job(
        run_scheduled_cleanup,
        trigger=CronTrigger(hour=3, minute=0),
        id="daily_cleanup",
        replace_existing=True
    )
    
    # Каждое воскресенье в 4:00 - глубокая очистка
    scheduler.add_job(
        run_deep_cleanup,
        trigger=CronTrigger(day_of_week='sun', hour=4, minute=0),
        id="weekly_deep_cleanup",
        replace_existing=True
    )
    
    scheduler.start()

async def run_scheduled_cleanup():
    """Ежедневная очистка"""
    async with async_session_maker() as db:
        storage_manager = StorageManager(db)
        await storage_manager.cleanup_orphaned_files()

async def run_deep_cleanup():
    """Глубокая еженедельная очистка"""
    async with async_session_maker() as db:
        storage_manager = StorageManager(db)
        await storage_manager.cleanup_orphaned_files()
        await storage_manager.cleanup_old_files(days_old=config.CLEANUP_DAYS)