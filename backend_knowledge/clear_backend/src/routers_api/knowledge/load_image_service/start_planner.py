# Запуск планировщика. Его вставить где в main или в роутере

# main.py
from scheduler.cleanup_scheduler import schedule_cleanup

app = FastAPI()

# При старте приложения
@app.on_event("startup")
async def startup_event():
    schedule_cleanup()