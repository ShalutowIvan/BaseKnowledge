import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
# from your_session_file import async_session_maker
from db_api.database import async_session_maker

# from your_models_file import User, UserRole
from routers_api.regusers.models import User, UserRole, UserStats, Token, Code_verify_client, ActivationCode
from routers_api.knowledge.models import Knowledge, Group, Image, Tab_list, Saved_tab
from routers_api.projects.models import Project, ProjectUserAssociation, Section, Task
from routers_api.roadmap.models import RoadMap, Chapter, Stage
# from your_auth_utils import hash_password  # Ваша функция хеширования пароля
from routers_api.regusers.secure import pwd_context, create_access_token, create_refresh_token, update_tokens, send_email_verify, send_email_restore_password, create_client_token

async def create_admin_user():
    """Создает первого администратора"""
    async with async_session_maker() as session:
        # Проверяем, существует ли уже администратор
        from sqlalchemy import select
        
        query = select(User).where(User.user_role == UserRole.ADMIN)
        result = await session.execute(query)
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Администратор уже существует")
            return
        
        # Создаем администратора
        admin = User(
            name="Admin",
            email="ivan_shalutow@mail.ru",
            hashed_password=pwd_context.hash("Asdf1234"),
            user_role=UserRole.ADMIN,
            is_active=True,
            service_active=True
        )
        
        session.add(admin)
        await session.commit()
        print("Администратор успешно создан")
        print("Email: admin@example.com")
        print("Пароль: your-admin-password")

if __name__ == "__main__":
    asyncio.run(create_admin_user())