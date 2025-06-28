# from enum import Enum, unique
import enum
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional
from datetime import datetime
# from ..regusers.models import User

from db_api import Base


@enum.unique
class Role(enum.Enum):
    """Роли пользователей в проекте"""
    ADMIN = "admin"#полные права на все, включая роли
    EDITOR = "editor"#только изменение и добавление чего либо в проекте и удаление задачи, удаление раздела. Не может удалить проект, не может менять роли
    VIEWER = "viewer"#только просмотр всех разделов
    GUEST = "guest"#это просто чтобы участник был в проекте, но без всяких прав. Если что поменять можно у него роль


# это таблица для связи многие ко многим. много проектов к многим пользакам
class ProjectUserAssociation(Base):
    __tablename__ = "project_user_association"

    # Составной первичный ключ (без отдельного id)
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    
    role: Mapped[Role] = mapped_column(SQLAlchemyEnum(Role))# Enum-роль


    # Обратные связи, они не тип лист тут, а один объект, в самих таблицах листы. 
    project: Mapped["Project"] = relationship(back_populates="users")
    user: Mapped["User"] = relationship(back_populates="projects")

    # Гарантируем уникальность пары (project_id, user_id)
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="_project_user_uc"),)



#в таблице Projects указывается связь с пользователем, и в зависимости от роли пользователя ему будет доступны те или иные действия. Номер проекта (id) можно будет подтянуть при открытии созданного проекта и запросить всю инфу о пользаке из таблицы ProjectUserAssociation, так как там обратная связь и с проектом и с юзером. 
class Project(Base):
    __tablename__ = "project"
    id: Mapped[int] = mapped_column(primary_key=True)#это как бы номер проекта в который будут включаться секции. В таблице секций(разделы) будет номер проекта указываться который соответствует номеру проекта
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))    
    # открываем проект, в нем будут разделы - секции. В секциях будут задачи. Например инет магаз, в нем секции корзина, авторизация. В корзине и авторизации свои задачи. 
    
    # связи
    users: Mapped[list["ProjectUserAssociation"]] = relationship(back_populates="project")# Связь с пользователями через ассоциативную таблицу
    sections: Mapped[list["Section"]] = relationship(back_populates="project", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")


    def add_user(self, user, role="guest"):
        """Добавляет пользователя в проект с указанной ролью."""
        association = ProjectUserAssociation(project=self, user=user, role=role)
        return association  # Возвращает объект для дальнейшей работы


class Section(Base):
    __tablename__ = "section"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    
    # первичный ключ на указания номера проекта
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id", ondelete="CASCADE"))
    # Связи
    project: Mapped["Project"] = relationship(back_populates="sections")
    tasks: Mapped[list["Task"]] = relationship(back_populates="section", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")


@enum.unique
class StatesTask(enum.Enum):
    """Статусы задач"""
    NEW = "new"
    AT_WORK = "at_work"
    COMPLETED = "completed"


class Task(Base):
    __tablename__ = "task"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    content: Mapped[str] = mapped_column(Text, default="_")
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)    
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))    
    updated_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))
    state: Mapped[StatesTask] = mapped_column(SQLAlchemyEnum(StatesTask), nullable=False)#состояние, сделать enum: не в работе, в работе, готова

    # связи
    section_id: Mapped[int] = mapped_column(ForeignKey("section.id", ondelete="CASCADE"))
    section: Mapped["Section"] = relationship(back_populates="tasks")
    
    
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




