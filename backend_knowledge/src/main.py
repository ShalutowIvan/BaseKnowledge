from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os


from routers_api.knowledge.router_api import router_knowledge_api

from routers_api.regusers.router_api import router_reg_api
from routers_api.regusers.admin_panel.routers_admin_panel import router_admin_panel

from routers_api.projects.router_api import router_project_api
from routers_api.roadmap.router_api import router_roadmap_api

from db_api.database import logger

from slowapi import _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from middleware.rate_limiter import limiter 


app = FastAPI(title="База знаний", debug=True)#debug=True это для того чтобы в документации выводилсь ошибки как в консоли. 

app.mount("/static", StaticFiles(directory="static"), name="static")

#роутеры
app.include_router(router_knowledge_api)
app.include_router(router_reg_api)
app.include_router(router_project_api)
app.include_router(router_roadmap_api)
app.include_router(router_admin_panel)


# для ограничения большого количества регистраций
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


origins = [
    "http://localhost:5173",  
   ]

# это для админки
from starlette.middleware.sessions import SessionMiddleware
from settings import KEY_ADMIN
app.add_middleware(
    SessionMiddleware, 
    secret_key=KEY_ADMIN, # секретный ключ
    session_cookie="admin_session",       # Имя куки
    same_site="lax",                      # Важно для безопасности
    https_only=False,  # True для production с HTTPS
    max_age=3600 * 24,  # Время жизни сессии в секундах (24 часа)
)
from admin import setup_admin
admin = setup_admin(app)


# это для API роутеров, которые работают с фронтом на react
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


#################### Начало админки starlette_admin ####################
# админка. Пока без защиты от других юзеров. То есть пользоваться может любой. Делаю для теста 
# from starlette_admin.contrib.sqla import Admin, ModelView

# from routers_api.regusers.models import UserRole, ActivationCodeStatus, User, ActivationCode, UserStats, Token, Code_verify_client
# from routers_api.regusers.auth_service import *

# from db_api.database import async_engine, async_session_maker

# from starlette_admin.auth import AuthProvider
# from starlette.responses import RedirectResponse, Response

# from starlette.middleware.base import BaseHTTPMiddleware


# from routers_api.regusers.secure import access_token_decode


# class DBSessionMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request: Request, call_next):
#         async with async_session_maker() as session:
#             request.state.session = session
#             response = await call_next(request)
#             return response

# app.add_middleware(DBSessionMiddleware)

# class CustomAuthProvider(AuthProvider):    

#     async def login(
#             self,
#             username: str,
#             password: str,            
#             remember_me: bool,
#             request: Request,
#             response: Response,            
#         ) -> Response:   

#         session: AsyncSession = request.state.session
#         form_data = OAuth2PasswordRequestForm(username=username, password=password)
#         auth_user = await auth_user_service(session=session, formData=form_data)
#         token = auth_user["Authorization"]
#         check = await access_token_decode(acces_token=str(token))

#         if check[3] == UserRole.ADMIN:
#             request.session.update({"user_id": str(check[1])})
            
#             # return RedirectResponse(url=request.url_for("admin:index"), status_code=302)
#             return RedirectResponse(url="/admin/", status_code=302)

#         return False


#     async def is_authenticated(self, request) -> bool:
#         return "user_id" in request.session

#     async def logout(self, request: Request) -> RedirectResponse:
#         request.session.clear()
#         # return RedirectResponse(url="/")
#         return RedirectResponse(url=request.url_for("admin:index"))

#     async def get_current_user(self, request: Request):
#         return request.session.get("user_id")

# auth_provider = CustomAuthProvider()

# admin = Admin(
#     async_engine, 
#     title="My Admin Panel",
#     auth_provider=auth_provider  # Вот этот ключ активирует проверку входа
# )

# admin.add_view(ModelView(User))
# admin.add_view(ModelView(ActivationCode))
# admin.add_view(ModelView(UserStats))
# admin.add_view(ModelView(Token))
# admin.add_view(ModelView(Code_verify_client))
# admin.mount_to(app)

# адрес админки: 127.0.0.1:8000/admin


#################### Конец админки ####################

# КОМАНДА ЗАПУСКА ВЕБ СЕРВЕРА: uvicorn main:app --reload
#uvicorn это команда запуска сервера, main - это название файла входа, app - это название объекта приложения. --reload это автоматический перезапуск приложения



###################### начало админки sqladmin ######################



###################### конец админки sqladmin

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, host="127.0.0.1", reload=True)




