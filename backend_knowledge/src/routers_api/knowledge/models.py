import enum

from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional, List
from datetime import datetime
from ..regusers.models import User

from db_api import Base

class Knowledges(Base):
    __tablename__ = "knowledges"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(default="_", nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))

    free_access: Mapped[bool] = mapped_column(default=False)
    # связи
    # группы
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id", ondelete="RESTRICT"))#ссылаемся на таблицу group на ее элемент id
    group: Mapped["Group"] = relationship(back_populates="knowledge")
    # юзеры
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="knowledge_user")
    
    # изображения. тут определил список изображений, а не одно изображение - [List["Images"]]
    images: Mapped[List["Images"]] = relationship(
        back_populates="knowledge", # Ссылка на обратное отношение в Images
        cascade="all, delete-orphan", # Автоматическое удаление связанных изображений
        lazy="selectin" # Жадная загрузка при использовании selectinload
        )

    
class Group(Base):
    __tablename__ = "groups"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name_group: Mapped[str] = mapped_column(nullable=False)
    slug: Mapped[str] = mapped_column(nullable=False)
    # связи
    knowledge: Mapped["Knowledges"] = relationship(back_populates="group")


class Images(Base):
    __tablename__ = "images"

    # Поля таблицы images
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(512), nullable=False)    
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    #связи. В полях таблицы Images будет указываться к какому знанию принадлежит изображение
    knowledge_id: Mapped[int] = mapped_column(ForeignKey("knowledges.id", ondelete="CASCADE"))
    knowledge: Mapped["Knowledges"] = relationship(back_populates="images")





    


# памятка для миграций БД
#команда для создания ревизиии миграции БД
# alembic revision --autogenerate -m "Table creation"
#команда для запуска миграции:
# alembic upgrade hash
# alembic upgrade head
#hash брать из файла миграции
#head - это значит до самой последней миграции




