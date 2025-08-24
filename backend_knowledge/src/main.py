from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os


from routers_api.knowledge.router_api import router_knowledge_api
from routers_api.regusers.router_api import router_reg_api
from routers_api.projects.router_api import router_project_api
from routers_api.roadmap.router_api import router_roadmap_api

from db_api.database import logger


app = FastAPI(title="База знаний", debug=True)#debug=True это для того чтобы в документации выводилсь ошибки как в консоли. 



app.mount("/static", StaticFiles(directory="static"), name="static")
#пояснения к статичным файлам
# ("папка из фаст апи вшитая", StaticFiles(directory="путь к папке со статичными файлами"), name="имя")

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)


#роутеры
app.include_router(router_knowledge_api)
app.include_router(router_reg_api)
app.include_router(router_project_api)
app.include_router(router_roadmap_api)

origins = [
    "http://localhost:5173",  
   ]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.middleware("http")
# async def log_exceptions(request: Request, call_next):
#     try:
#         response = await call_next(request)
#         return response
#     except HTTPException as exc:
#         # Логируем HTTPException с деталями
#         logger.error(
#             f"HTTPException: status_code - {exc.status_code}, detail - {exc.detail}, path - {request.url.path}, method - {request.method}",
#             # extra={
#             #     "status_code": exc.status_code,
#             #     "detail": exc.detail,
#             #     "path": request.url.path,
#             #     "method": request.method
#             # },
#             exc_info=True 
#         )
#         raise exc
#     except Exception as exc:
#         # Логируем другие исключения
#         logger.exception(f"Unhandled exception: {str(exc)}")
#         raise HTTPException(status_code=500, detail="Internal Server Error")

# полезное логировнаие при разработке. Пишет ошибки и в каком файле они появились и в какой строке
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Логируем ошибку
    logger.error(
        f"HTTPException: status_code - {exc.status_code}, detail - {exc.detail}, path - {request.url.path}, method - {request.method}",        
        exc_info=True
    )
    
    # Возвращаем стандартный ответ
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )







# КОМАНДА ЗАПУСКА ВЕБ СЕРВЕРА: uvicorn main:app --reload
#uvicorn это команда запуска сервера, main - это название файла входа, app - это название объекта приложения. --reload это автоматический перезапуск приложения



if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, host="127.0.0.1", reload=True)

