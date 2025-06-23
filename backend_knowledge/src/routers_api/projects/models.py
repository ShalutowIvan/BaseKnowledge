import enum

from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional
from datetime import datetime
from ..regusers.models import User

from db_api import Base

class Projects(Base):#тут поменять все поля, пока не редачил, только скопировал из модели знаний
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(default="_")

    # открываем проект, в нем будут разделы - секции. В секциях будут задачи. Например инет магаз, в нем секции корзина, авторизация. В корзине и авторизации свои задачи. 




class Sections(Base):
    __tablename__ = "sections"



class Tasks(Base):
    __tablename__ = "tasks"





    slug: Mapped[str] = mapped_column(unique=True, nullable=False)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))

    free_access: Mapped[bool] = mapped_column(default=False)
    # связи
    # группы
    group_id: Mapped[int] = mapped_column(ForeignKey("group.id", ondelete="RESTRICT"))#ссылаемся на таблицу group на ее элемент id
    group: Mapped["Group"] = relationship(back_populates="knowledge")
    # юзеры
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="knowledge")
    # user: Mapped["User"] = relationship(back_populates="knowledge") это обозначение связи с моделью User, back_populates="knowledge" тут указывается параметр из модели User обозначающий связь с текущей моделью. 
    #так это выглядит в модели User: knowledge: Mapped["Knowledges"] = relationship(back_populates="user")
    

















# памятка для миграций БД
#команда для создания ревизиии миграции БД
# alembic revision --autogenerate -m "Table creation"
#команда для запуска миграции:
# alembic upgrade hash
# alembic upgrade head
#hash брать из файла миграции
#head - это значит до самой последней миграции




