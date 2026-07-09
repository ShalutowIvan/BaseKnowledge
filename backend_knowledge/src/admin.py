from starlette_admin import BaseAdmin
from starlette_admin.contrib.sqla import Admin, ModelView
from starlette_admin.auth import AuthProvider
from starlette_admin.views import DropDown
from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.exceptions import LoginFailed

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Any
import jwt
from datetime import datetime, timedelta

# from your_models_file import (
#     Base, User, Knowledge, Group, Image, Tab_list, Saved_tab,
#     UserStorage, Project, ProjectUserAssociation, Section,
#     Task, ActivationCode, UserStats, Token, Code_verify_client,
#     RoadMap, Chapter, Stage
# )
from routers_api.regusers.models import *
from routers_api.knowledge.models import *
from routers_api.projects.models import *
from routers_api.roadmap.models import *
from routers_api.regusers.secure import pwd_context

# from your_session_file import async_engine, async_session_maker
from db_api.database import async_engine, get_async_session, Base, async_session_maker


# from settings import SECRET_KEY  # Добавьте секретный ключ в settings.py
from settings import KEY_ADMIN


# ============ Конфигурация авторизации ============

class AdminAuthProvider(AuthProvider):
    """Провайдер авторизации для админ-панели"""
    
    async def login(
        self,
        username: str,
        password: str,
        remember_me: bool = True,
        request: Optional[Request] = None,
        response: Optional[Response] = None,
    ) -> Response:
        """
        Проверяет учетные данные администратора
        """
        if not username or not password:
            raise LoginFailed("Необходимо указать email и пароль")
        
        async with async_session_maker() as session:
            
            # from your_auth_utils import verify_password  # Ваша функция проверки пароля
            
            # Ищем пользователя с ролью ADMIN
            query = select(User).where(
                User.email == username,
                User.user_role == 'admin'  # или используйте вашу константу UserRole.ADMIN
            )
            result = await session.execute(query)
            user = result.scalar_one_or_none()
            
            if not user:
                raise LoginFailed("Неверный email или пароль")
            
            # Проверяем пароль (используйте вашу функцию проверки)
            if not pwd_context.verify(password, user.hashed_password):
                raise LoginFailed("Неверный email или пароль")
            
            if not user.is_active:
                raise LoginFailed("Аккаунт не активирован")
            
            if user.is_banned:
                raise LoginFailed("Аккаунт заблокирован")
            
            # Создаем JWT токен для админ-сессии
            token_data = {
                "sub": str(user.id),
                "email": user.email,
                "role": user.user_role.value if hasattr(user.user_role, 'value') else user.user_role,
                "type": "admin_access"
            }
            
            token = jwt.encode(
                token_data,
                KEY_ADMIN,
                algorithm="HS256",
                headers={"exp": str(int((datetime.utcnow() + timedelta(hours=24)).timestamp()))}
            )
            
            # Устанавливаем cookie с токеном
            response.set_cookie(
                "admin_token",
                token,
                max_age=86400,  # 24 часа
                httponly=True,
                secure=False,  # В продакшене установите True
                samesite="lax"
            )
            
            return response
    
    async def is_authenticated(self, request: Request) -> bool:
        """
        Проверяет, авторизован ли текущий пользователь как админ
        """
        token = request.cookies.get("admin_token")
        if not token:
            # Проверяем также в заголовке Authorization
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return False
        
        try:
            payload = jwt.decode(token, KEY_ADMIN, algorithms=["HS256"])
            
            # Проверяем тип токена
            if payload.get("type") != "admin_access":
                return False
            
            # Проверяем срок действия
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(int(exp)) < datetime.utcnow():
                return False
            
            # Сохраняем данные пользователя в request.state для использования в представлениях
            request.state.admin_user = payload
            return True
            
        except jwt.InvalidTokenError:
            return False
    
    async def get_admin_user(self, request: Request) -> dict:
        """Возвращает данные текущего администратора"""
        payload = getattr(request.state, 'admin_user', None)
        if payload:
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role")
            }
        return {}
    
    async def logout(
        self, request: Request, response: Response
    ) -> Response:
        """Выход из админ-панели"""
        response.delete_cookie("admin_token")
        return response

# ============ Кастомные представления моделей ============

class UserAdminView(ModelView):
    """Представление для управления пользователями"""
    
    # Поля, которые будут отображаться в таблице
    fields = [
        User.id,
        User.name,
        User.email,
        User.user_role,
        User.is_active,
        User.is_banned,
        User.service_active,
        User.time_create_user,
    ]
    
    # Поля, по которым можно искать
    searchable_fields = [User.name, User.email]
    
    # Поля для сортировки
    sortable_fields = [User.id, User.name, User.email, User.time_create_user]
    
    # Поля только для чтения
    readonly_fields = [User.id, User.time_create_user]
    
    # Исключаем пароль из отображения
    exclude_fields_from_list = [User.hashed_password]
    exclude_fields_from_detail = [User.hashed_password]
    exclude_fields_from_create = [User.hashed_password]
    exclude_fields_from_edit = [User.hashed_password]
    
    # Настройка отображения в списке
    list_template = "list.html"
    
    # Количество записей на странице
    page_size = 20
    
    # Ярлыки для полей
    labels = {
        "id": "ID",
        "name": "Имя",
        "email": "Email",
        "user_role": "Роль",
        "is_active": "Активен",
        "is_banned": "Заблокирован",
        "service_active": "Сервис активен",
        "time_create_user": "Дата создания",
    }

class KnowledgeAdminView(ModelView):
    """Представление для базы знаний"""
    
    fields = [
        Knowledge.id,
        Knowledge.title,
        Knowledge.slug,
        Knowledge.group,
        Knowledge.user,
        Knowledge.free_access,
        Knowledge.created_at,
        Knowledge.updated_at,
    ]
    
    searchable_fields = [Knowledge.title, Knowledge.description, Knowledge.content]
    sortable_fields = [Knowledge.id, Knowledge.title, Knowledge.created_at]
    
    # Поля для фильтрации
    list_filter = ["free_access", "group", "user"]
    
    labels = {
        "id": "ID",
        "title": "Заголовок",
        "slug": "URL-slug",
        "group": "Группа",
        "user": "Пользователь",
        "free_access": "Свободный доступ",
        "created_at": "Создано",
        "updated_at": "Обновлено",
    }

class GroupAdminView(ModelView):
    """Представление для групп"""
    
    fields = [Group.id, Group.name_group, Group.slug, Group.user]
    searchable_fields = [Group.name_group, Group.slug]
    sortable_fields = [Group.id, Group.name_group]
    
    labels = {
        "id": "ID",
        "name_group": "Название группы",
        "slug": "URL-slug",
        "user": "Пользователь",
    }

class ImageAdminView(ModelView):
    """Представление для изображений"""
    
    fields = [
        Image.id,
        Image.filename,
        Image.filepath,
        Image.file_size,
        Image.original_size,
        Image.compression_ratio,
        Image.knowledge,
        Image.created_at,
    ]
    
    searchable_fields = [Image.filename]
    sortable_fields = [Image.id, Image.filename, Image.file_size, Image.created_at]
    
    labels = {
        "id": "ID",
        "filename": "Имя файла",
        "filepath": "Путь к файлу",
        "file_size": "Размер (байт)",
        "original_size": "Исходный размер (байт)",
        "compression_ratio": "Степень сжатия",
        "knowledge": "Знание",
        "created_at": "Создано",
    }

class ProjectAdminView(ModelView):
    """Представление для проектов"""
    
    fields = [
        Project.id,
        Project.title,
        Project.description,
        Project.created_at,
    ]
    
    searchable_fields = [Project.title, Project.description]
    sortable_fields = [Project.id, Project.title, Project.created_at]
    
    labels = {
        "id": "ID",
        "title": "Название проекта",
        "description": "Описание",
        "created_at": "Создано",
    }

class ProjectUserAssociationAdminView(ModelView):
    """Представление для связей проектов и пользователей"""
    
    fields = [
        ProjectUserAssociation.project_id,
        ProjectUserAssociation.user_id,
        ProjectUserAssociation.role,
    ]
    
    searchable_fields = []
    sortable_fields = ["project_id", "user_id", "role"]
    
    labels = {
        "project_id": "Проект",
        "user_id": "Пользователь",
        "role": "Роль в проекте",
    }

class SectionAdminView(ModelView):
    """Представление для разделов проектов"""
    
    fields = [
        Section.id,
        Section.title,
        Section.description,
        Section.project,
        Section.created_at,
    ]
    
    searchable_fields = [Section.title, Section.description]
    sortable_fields = [Section.id, Section.title, Section.created_at]
    
    labels = {
        "id": "ID",
        "title": "Название раздела",
        "description": "Описание",
        "project": "Проект",
        "created_at": "Создано",
    }

class TaskAdminView(ModelView):
    """Представление для задач"""
    
    fields = [
        Task.id,
        Task.title,
        Task.state,
        Task.section,
        Task.created_at,
        Task.updated_at,
    ]
    
    searchable_fields = [Task.title, Task.description]
    sortable_fields = [Task.id, Task.title, Task.state, Task.created_at]
    list_filter = ["state"]
    
    labels = {
        "id": "ID",
        "title": "Название задачи",
        "state": "Статус",
        "section": "Раздел",
        "created_at": "Создано",
        "updated_at": "Обновлено",
    }

class ActivationCodeAdminView(ModelView):
    """Представление для кодов активации"""
    
    fields = [
        ActivationCode.id,
        ActivationCode.code,
        ActivationCode.status,
        ActivationCode.created_at,
        ActivationCode.expires_at,
        ActivationCode.activated_user,
        ActivationCode.creator_admin,
    ]
    
    searchable_fields = [ActivationCode.code]
    sortable_fields = [ActivationCode.id, ActivationCode.status, ActivationCode.created_at]
    list_filter = ["status"]
    
    labels = {
        "id": "ID",
        "code": "Код активации",
        "status": "Статус",
        "created_at": "Создан",
        "expires_at": "Истекает",
        "activated_user": "Активирован пользователем",
        "creator_admin": "Создан администратором",
    }

class RoadMapAdminView(ModelView):
    """Представление для дорожных карт"""
    
    fields = [
        RoadMap.id,
        RoadMap.title,
        RoadMap.description,
        RoadMap.user,
        RoadMap.created_at,
    ]
    
    searchable_fields = [RoadMap.title, RoadMap.description]
    sortable_fields = [RoadMap.id, RoadMap.title, RoadMap.created_at]
    
    labels = {
        "id": "ID",
        "title": "Название",
        "description": "Описание",
        "user": "Пользователь",
        "created_at": "Создано",
    }

class ChapterAdminView(ModelView):
    """Представление для глав"""
    
    fields = [
        Chapter.id,
        Chapter.title,
        Chapter.roadmap,
        Chapter.user,
        Chapter.created_at,
    ]
    
    searchable_fields = [Chapter.title, Chapter.description]
    sortable_fields = [Chapter.id, Chapter.title, Chapter.created_at]
    
    labels = {
        "id": "ID",
        "title": "Название главы",
        "roadmap": "Дорожная карта",
        "user": "Пользователь",
        "created_at": "Создано",
    }

class StageAdminView(ModelView):
    """Представление для этапов"""
    
    fields = [
        Stage.id,
        Stage.title,
        Stage.state,
        Stage.chapter,
        Stage.user,
        Stage.created_at,
        Stage.updated_at,
    ]
    
    searchable_fields = [Stage.title, Stage.description]
    sortable_fields = [Stage.id, Stage.title, Stage.state, Stage.created_at]
    list_filter = ["state"]
    
    labels = {
        "id": "ID",
        "title": "Название этапа",
        "state": "Статус",
        "chapter": "Глава",
        "user": "Пользователь",
        "created_at": "Создано",
        "updated_at": "Обновлено",
    }

class UserStorageAdminView(ModelView):
    """Представление для хранилища пользователей"""
    
    fields = [
        UserStorage.id,
        UserStorage.user,
        UserStorage.total_files_count,
        UserStorage.total_storage_bytes,
        UserStorage.last_updated,
    ]
    
    searchable_fields = []
    sortable_fields = [UserStorage.id, UserStorage.total_files_count, UserStorage.total_storage_bytes]
    
    labels = {
        "id": "ID",
        "user": "Пользователь",
        "total_files_count": "Всего файлов",
        "total_storage_bytes": "Всего байт",
        "last_updated": "Последнее обновление",
    }

class UserStatsAdminView(ModelView):
    """Представление для статистики пользователей"""
    
    fields = [
        UserStats.id,
        UserStats.user,
        UserStats.knowledge_count,
        UserStats.images_count,
        UserStats.projects_count,
        UserStats.tasks_count,
        UserStats.last_activity_at,
        UserStats.updated_at,
    ]
    
    searchable_fields = []
    sortable_fields = [
        UserStats.id,
        UserStats.knowledge_count,
        UserStats.images_count,
        UserStats.projects_count,
        UserStats.last_activity_at,
    ]
    
    labels = {
        "id": "ID",
        "user": "Пользователь",
        "knowledge_count": "Знаний",
        "images_count": "Изображений",
        "projects_count": "Проектов",
        "tasks_count": "Задач",
        "last_activity_at": "Последняя активность",
        "updated_at": "Обновлено",
    }

class TabListAdminView(ModelView):
    """Представление для списков вкладок"""
    
    fields = [
        Tab_list.id,
        Tab_list.name,
        Tab_list.user,
        Tab_list.created_at,
        Tab_list.updated_at,
    ]
    
    searchable_fields = [Tab_list.name, Tab_list.description]
    sortable_fields = [Tab_list.id, Tab_list.name, Tab_list.created_at]
    
    labels = {
        "id": "ID",
        "name": "Название",
        "user": "Пользователь",
        "created_at": "Создано",
        "updated_at": "Обновлено",
    }

class SavedTabAdminView(ModelView):
    """Представление для сохраненных вкладок"""
    
    fields = [
        Saved_tab.id,
        Saved_tab.position,
        Saved_tab.tab_list_connect,
        Saved_tab.knowledge_connect,
        Saved_tab.created_at,
    ]
    
    searchable_fields = []
    sortable_fields = [Saved_tab.id, Saved_tab.position, Saved_tab.created_at]
    
    labels = {
        "id": "ID",
        "position": "Позиция",
        "tab_list_connect": "Список вкладок",
        "knowledge_connect": "Знание",
        "created_at": "Создано",
    }

# ============ Создание админ-панели ============

def create_admin(app=None):
    """
    Создает и настраивает админ-панель
    
    Args:
        app: FastAPI приложение (опционально)
    """
    
    # Создаем экземпляр Admin
    admin = Admin(
        engine=async_engine,
        title="Knowledge Base Admin",
        base_url="/admin",  # URL для доступа к админке
        auth_provider=AdminAuthProvider(),
        # logo_url="https://example.com/logo.png",  # Можно добавить логотип
        debug=False,  # В продакшене установите False
    )
    
    # Добавляем модели в админку
    admin.add_view(UserAdminView(User, icon="fa fa-users", label="Пользователи"))
    admin.add_view(KnowledgeAdminView(Knowledge, icon="fa fa-book", label="Знания"))
    admin.add_view(GroupAdminView(Group, icon="fa fa-folder", label="Группы"))
    admin.add_view(ImageAdminView(Image, icon="fa fa-image", label="Изображения"))
    
    # Проекты и задачи
    admin.add_view(ProjectAdminView(Project, icon="fa fa-project-diagram", label="Проекты"))
    admin.add_view(ProjectUserAssociationAdminView(
        ProjectUserAssociation, 
        icon="fa fa-link", 
        label="Связи проектов"
    ))
    admin.add_view(SectionAdminView(Section, icon="fa fa-sitemap", label="Разделы"))
    admin.add_view(TaskAdminView(Task, icon="fa fa-tasks", label="Задачи"))
    
    # Активационные коды
    admin.add_view(ActivationCodeAdminView(
        ActivationCode, 
        icon="fa fa-key", 
        label="Коды активации"
    ))
    
    # RoadMap
    admin.add_view(RoadMapAdminView(RoadMap, icon="fa fa-map", label="Road Maps"))
    admin.add_view(ChapterAdminView(Chapter, icon="fa fa-list-ol", label="Главы"))
    admin.add_view(StageAdminView(Stage, icon="fa fa-flag", label="Этапы"))
    
    # Статистика и хранилище
    admin.add_view(UserStorageAdminView(
        UserStorage, 
        icon="fa fa-database", 
        label="Хранилище"
    ))
    admin.add_view(UserStatsAdminView(
        UserStats, 
        icon="fa fa-chart-bar", 
        label="Статистика"
    ))
    
    # Вкладки
    admin.add_view(TabListAdminView(
        Tab_list, 
        icon="fa fa-list", 
        label="Списки вкладок"
    ))
    admin.add_view(SavedTabAdminView(
        Saved_tab, 
        icon="fa fa-bookmark", 
        label="Сохраненные вкладки"
    ))
    
    return admin

# Создаем глобальный экземпляр админки
admin = create_admin()