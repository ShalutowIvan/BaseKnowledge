from enum import Enum
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional
from datetime import datetime
from ..regusers.models import User

from db_api import Base


class Role(Enum):
    ADMIN = "admin"#полные права на все, включая роли
    EDITOR = "editor"#только изменение и добавление чего либо в проекте и удаление задачи, удаление раздела. Не может удалить проект, не может менять роли
    VIEWER = "viewer"#только просмотр всех разделов
    GUEST = "guest"#это просто чтобы участник был в проекте, но без всяких прав. Если что поменять можно у него роль


# это таблица для связи многие ко многим. много проектов к многим пользакам
class ProjectUserAssociation(Base):
    __tablename__ = "project_user_association"

    # Составной первичный ключ (без отдельного id)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    
    role: Mapped[Role] = mapped_column(nullable=False)# Enum-роль

    # Обратные связи
    project: Mapped["Project"] = relationship(back_populates="users")
    user: Mapped["User"] = relationship(back_populates="projects")

    # Гарантируем уникальность пары (project_id, user_id)
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="_project_user_uc"),)



#в таблице Projects указывается связь с пользователем, и в зависимости от роли пользователя ему будет доступны те или иные действия. Номер проекта (id) можно будет подтянуть при открытии созданного проекта и запросить всю инфу о пользаке из таблицы ProjectUserAssociation, так как там обратная связь и с проектом и с юзером. 
class Projects(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)#это как бы номер проекта в который будут включаться секции. В таблице секций будет номер проекта указываться который соответствует номеру проекта
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))    
    # открываем проект, в нем будут разделы - секции. В секциях будут задачи. Например инет магаз, в нем секции корзина, авторизация. В корзине и авторизации свои задачи. 
    
    # связи
    users: Mapped[list["ProjectUserAssociation"]] = relationship(back_populates="project")# Связь с пользователями через ассоциативную таблицу
    sections: Mapped[list["Sections"]] = relationship(back_populates="project")


    def add_user(self, user, role="guest"):
        """Добавляет пользователя в проект с указанной ролью."""
        association = ProjectUserAssociation(project=self, user=user, role=role)
        return association  # Возвращает объект для дальнейшей работы


class Sections(Base):
    __tablename__ = "sections"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    
    # первичный ключ на указание проекта
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    # Связи
    project: Mapped["Projects"] = relationship(back_populates="sections", cascade="all, delete-orphan", lazy="selectin")
    tasks: Mapped[list["Tasks"]] = relationship(back_populates="section")



class StatesTasks(Enum):
    NEW = "new"
    AT_WORK = "at_work"
    COMPLETED = "completed"


class Tasks(Base):
    __tablename__ = "tasks"
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    content: Mapped[str] = mapped_column(Text, default="_")
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)    
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))
    state: Mapped[StatesTasks] = mapped_column(nullable=False)#состояние, сделать enum: не в работе, в работе, готова

    # связи
    section_id: Mapped[int] = mapped_column(ForeignKey("sections.id", ondelete="CASCADE"))
    section: Mapped["Sections"] = relationship(back_populates="tasks", cascade="all, delete-orphan", lazy="selectin")
    # юзеры
    
    
# Иерархия связей:

# Проект (Project) → Разделы (Section) → Задачи (Task).

# Связь многие-ко-многим между Project и User через ProjectUserAssociation.













# памятка для миграций БД
#команда для создания ревизиии миграции БД
# alembic revision --autogenerate -m "Table creation"
#команда для запуска миграции:
# alembic upgrade hash
# alembic upgrade head
#hash брать из файла миграции
#head - это значит до самой последней миграции




