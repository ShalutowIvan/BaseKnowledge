# from enum import Enum, unique
import enum
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional
from datetime import datetime
# from ..regusers.models import User

from db_api import Base

 
class RoadMap(Base):
    __tablename__ = "roadmap"
    id: Mapped[int] = mapped_column(primary_key=True)#это как бы номер проекта в который будут включаться секции. В таблице секций(разделы) будет номер проекта указываться который соответствует номеру проекта
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))    
    # открываем проект, в нем будут разделы - секции. В секциях будут задачи. Например инет магаз, в нем секции корзина, авторизация. В корзине и авторизации свои задачи. 
    
    # связи
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="roadmap_user")
    
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="roadmap", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")    


class Chapter(Base):
    __tablename__ = "chapter"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    
    # первичный ключ на указания номера роадмапы, то есть id
    roadmap_id: Mapped[int] = mapped_column(ForeignKey("roadmap.id", ondelete="CASCADE"))
    # Связи
    roadmap: Mapped["RoadMap"] = relationship(back_populates="chapters")
    stages: Mapped[list["Stage"]] = relationship(back_populates="chapter", cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")


@enum.unique
class StatesStage(enum.Enum):
    """Статусы этапов изучения"""
    NOT_STUDIED = "not_studied"
    IN_THE_STUDY = "in_the_study"
    COMPLETED = "completed"


class Stage(Base):
    __tablename__ = "stage"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    content: Mapped[str] = mapped_column(Text, default="_")
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)    
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))    
    updated_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))
    state: Mapped[StatesStage] = mapped_column(SQLAlchemyEnum(StatesStage), default=StatesStage.NOT_STUDIED)

    # связи
    chapter_id: Mapped[int] = mapped_column(ForeignKey("chapter.id", ondelete="CASCADE"))
    chapter: Mapped["Chapter"] = relationship(back_populates="stages")
    
    





# памятка для миграций БД
#команда для создания ревизиии миграции БД
# alembic revision --autogenerate -m "Table creation"
#команда для запуска миграции:
# alembic upgrade hash
# alembic upgrade head
#hash брать из файла миграции
#head - это значит до самой последней миграции




