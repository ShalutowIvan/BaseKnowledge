from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, DateTime, text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from db_api import Base
import uuid

from ..projects.models import ProjectUserAssociation, Project, Role

@enum.unique
class UserRole(str, enum.Enum):
    USER = "user"
    ACTIVATOR = "activator"
    ADMIN = "admin"


@enum.unique
class ActivationCodeStatus(str, enum.Enum):
    NOT_ACTIVATED = "not_activated"
    ACTIVATED = "activated"
    EXPIRED = "expired"
    DEACTIVATED = "deactivated"


class User(Base):
    __tablename__ = "user"
    # id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id: Mapped[int] = mapped_column(primary_key=True)#пока так, если что потом заменить на uuid
    name: Mapped[str] = mapped_column(String(256))
    time_create_user: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    email: Mapped[str] = mapped_column(String(length=320), unique=True, nullable=False)    
    hashed_password: Mapped[str] = mapped_column(String(length=1024), nullable=False)
    
    is_active: Mapped[bool] = mapped_column(default=False, nullable=False)#активация учетки при переходе по ссылке из письма при реге, нужно для проверки актуальности почты
    
    
    #связи
    knowledge_user: Mapped["Knowledge"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")
    group_user: Mapped["Group"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")
    roadmap_user: Mapped["RoadMap"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")
    chapter_user: Mapped["Chapter"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")
    stage_user: Mapped["Stage"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")
    storage_usage: Mapped["UserStorage"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")

    # сохранение поиска пока решил не делать. Пока не нужно. Но модель оставил
    # saved_search_user: Mapped["SavedSearch"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")

    # сохранение списка вкладок
    tab_list_user: Mapped["Tab_list"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")

    tokens: Mapped["Token"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")    
    client_generate: Mapped["Code_verify_client"] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")

    # Связь с проектами через ассоциативную таблицу
    projects: Mapped[list["ProjectUserAssociation"]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")

    
    # поля для кодов активации сервисов
    user_role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)#админ или нет

    service_active: Mapped[bool] = mapped_column(default=False, nullable=False)#это обозначение того, что активны ли сервисы. Решил сделать закрытый проект, в котором будут только те участники которым я дам код активации

    is_banned: Mapped[bool] = mapped_column(Boolean, default=False) # Заблокирован ли

    # связи для кодов активации
    # Первая связь: какой код использовал пользователь (если он обычный пользователь)
    activation_code: Mapped["ActivationCode"] = relationship(
        "ActivationCode", 
        back_populates="activated_user",
        foreign_keys="ActivationCode.user_id",
        uselist=False  # Один пользователь - один код активации
    )    
    # Вторая связь: какие коды создал (если он администратор)
    created_activation_codes: Mapped[list["ActivationCode"]] = relationship(
        "ActivationCode", 
        back_populates="creator_admin",
        foreign_keys="ActivationCode.created_by"
    )


    # функция для создания проекта в разделе "Проекты" модель Project
    def create_project(self, title, description):
        """Создаёт проект и автоматически добавляет создателя как администратора."""
        project = Project(title=title, description=description)
        project.add_user(user=self, role=Role.ADMIN)  # Создатель = администратор
        return project


# таблица с кодами активации
class ActivationCode(Base):
    __tablename__ = "activation_code"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    status: Mapped[ActivationCodeStatus] = mapped_column(Enum(ActivationCodeStatus), default=ActivationCodeStatus.NOT_ACTIVATED)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(days=30))    
    updated_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))


    # note: Mapped[str | None] = mapped_column(String(255), nullable=True)  # заметка админа может быть и не надо
    
    # Внешние ключи. 
    # Кем создан
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)
    # И кем активирован
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Связи с более понятными именами
    activated_user: Mapped[User | None] = relationship(
        "User", 
        back_populates="activation_code", 
        foreign_keys=[user_id],
        # lazy="select"

    )
    
    creator_admin: Mapped[User] = relationship(
        "User", 
        back_populates="created_activation_codes", 
        foreign_keys=[created_by]
    )

    # # Свойства для удобства
    # @property
    # def is_expired(self) -> bool:
    #     return datetime.utcnow() > self.expires_at
    
    # @property
    # def is_valid(self) -> bool:
    #     return self.status == "active" and not self.is_expired




# Зачем мне отдельная таблица со списком админов если уже есть таблица со списком юзеров и у юзеров есть роль, можно по ним понять кто админ. 
# сделать роли для админов чтобы мог приглашать админов или юзеров и тд. Логикук пересмотреть

# это таблица с рефреш токеном
class Token(Base):
    __tablename__ = "token"

    id: Mapped[int] = mapped_column(primary_key=True)
    refresh_token = mapped_column(String(length=320), unique=True, nullable=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    
    user: Mapped["User"] = relationship(back_populates="tokens")


#таблица с токеном клиента, тут зашифрованный client_token в виде jwt. Время жизни будет сутки, для боевого режима примерно час. Без клиент токена нужно заново логиниться
class Code_verify_client(Base):
    __tablename__ = "verify_client"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_token: Mapped[str] = mapped_column(String(length=320), unique=True, nullable=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    
    user: Mapped["User"] = relationship(back_populates="client_generate")

