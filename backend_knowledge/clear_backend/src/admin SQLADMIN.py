# from sqladmin import Admin, ModelView
# from sqladmin.authentication import AuthenticationBackend
# from starlette.requests import Request
# from fastapi import FastAPI
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select

# from db_api.database import async_engine, get_async_session, Base
# from routers_api.regusers.models import User, UserRole  # Импортируйте ваши модели
# from routers_api.projects.models import *



# import os
# from dotenv import load_dotenv

# load_dotenv()

# # Секретный ключ для сессий (должен быть в .env файле)
# from settings import KEY_ADMIN

# from routers_api.regusers.secure import pwd_context # для админки sql-admin

# # методы для админки sqladmin
# def verify_password(self, password: str) -> bool:
#     """Проверка пароля"""
#     return pwd_context.verify(password, self.hashed_password)


# def hash_password(password: str) -> str:
#     """Хеширование пароля"""
#     return pwd_context.hash(password)


# class AdminAuth(AuthenticationBackend):
#     """Кастомная аутентификация для админки"""
    
#     async def login(self, request: Request) -> bool:
#         form = await request.form()
#         username = form.get("username")
#         password = form.get("password")
        
#         # Получаем сессию БД
#         async for session in get_async_session():
#             try:
#                 # Ищем пользователя по email
#                 stmt = select(User).where(User.email == username)
#                 result = await session.execute(stmt)
#                 user = result.scalar_one_or_none()
                
#                 # Проверяем пароль и роль администратора
#                 if user and verify_password(password) and user.user_role == UserRole.ADMIN:
#                     # Сохраняем ID пользователя в сессии
#                     request.session.update({"user_id": user.id})
#                     return True
#                 return False
#             finally:
#                 await session.close()
    
#     async def logout(self, request: Request) -> bool:
#         request.session.clear()
#         return True
    
#     async def authenticate(self, request: Request) -> bool:
#         user_id = request.session.get("user_id")
#         if not user_id:
#             return False
        
#         # Проверяем, что пользователь всё ещё админ
#         async for session in get_async_session():
#             try:
#                 stmt = select(User).where(
#                     User.id == user_id,
#                     User.user_role == UserRole.ADMIN
#                 )
#                 result = await session.execute(stmt)
#                 user = result.scalar_one_or_none()
#                 return user is not None
#             finally:
#                 await session.close()
        
#         return False


# # Создаем бэкенд аутентификации
# authentication_backend = AdminAuth(secret_key=KEY_ADMIN)

# from wtforms.fields import PasswordField

# class UserAdmin(ModelView, model=User):
#     """Админ-панель для пользователей"""
#     column_list = [
#         User.id,
#         User.name,
#         User.email,
#         User.user_role,
#         User.is_active,
#         User.is_banned,
#         User.time_create_user,
#     ]
#     column_searchable_list = [User.name, User.email]
#     column_sortable_list = [User.id, User.name, User.email, User.time_create_user]
#     column_default_sort = [(User.time_create_user, True)]  # Сортировка по дате создания
    
#     can_create = True
#     can_edit = True
#     can_delete = True
#     can_view_details = True
    
#     # Скрываем пароль из списка
#     # column_exclude_list = [User.hashed_password]
    
#     # Группировка полей в форме
#     form_groups = [
#         ("Основная информация", ["name", "email", "hashed_password"]),
#         ("Статус", ["is_active", "is_banned", "user_role", "service_active"]),
#     ]

#     form_overrides = {
#         "hashed_password": PasswordField
#     }


# excluded_models = {ProjectUserAssociation, Project, Section}

# def setup_admin(app: FastAPI):
#     """Настройка и подключение админки к приложению"""
    
#     admin = Admin(
#         app,
#         async_engine,
#         title="Admin Panel",
#         authentication_backend=authentication_backend,
#         base_url="/admin",
#         templates_dir="templates"  # Опционально, если нужны кастомные шаблоны
#     )
    
#     # Автоматическое добавление всех моделей из Base
#     for model_class in Base.__subclasses__():
#         # Создаем класс ModelView динамически

#         if model_class in excluded_models:
#             continue

#         view_class = type(
#             f"{model_class.__name__}Admin",
#             (ModelView,),
#             {
#                 "model": model_class,
#                 "can_create": True,
#                 "can_edit": True,
#                 "can_delete": True,
#                 "can_view_details": True,
#             }
#         )
#         admin.add_view(view_class)
    
#     # Если нужны кастомные настройки для определенных моделей,
#     # добавляем их отдельно (переопределяя автоматически созданные)
#     admin.add_view(UserAdmin)
    
#     return admin