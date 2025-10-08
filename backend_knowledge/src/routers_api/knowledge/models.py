import enum
from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum, func, Computed
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional, List
from datetime import datetime
from ..regusers.models import User

from db_api import Base



class Knowledge(Base):
    __tablename__ = "knowledge"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(default="_", nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))

    free_access: Mapped[bool] = mapped_column(default=False)
    # связи
    # группы
    group_id: Mapped[int] = mapped_column(ForeignKey("group.id", ondelete="RESTRICT"))#ссылаемся на таблицу group на ее элемент id
    group: Mapped["Group"] = relationship(back_populates="knowledge")#убрал , lazy="selectin"
    # юзеры
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="knowledge_user")

    # сохраненные вкладки
    saved_tab_connect: Mapped["Saved_tab"] = relationship(back_populates="knowledge_connect", cascade="all, delete-orphan", passive_deletes=True)# убрал , lazy="selectin"

    
    # изображения. тут определил список изображений, а не одно изображение - [List["Images"]]
    images: Mapped[List["Image"]] = relationship(
        back_populates="knowledge", # Ссылка на обратное отношение в Images
        cascade="all, delete-orphan", # Автоматическое удаление связанных изображений        
        )#убрал lazy="selectin" # Жадная загрузка при использовании selectinload

    #вектор для улучшенного поиска
    search_vector: Mapped[TSVECTOR] = mapped_column(
        TSVECTOR,
        Computed(
            "setweight(to_tsvector('russian', coalesce(title, '')), 'A') || "
            "setweight(to_tsvector('russian', coalesce(description, '')), 'B') || "
            "setweight(to_tsvector('russian', coalesce(content, '')), 'C')",
            persisted=True
        )
    )

    


    
class Group(Base):
    __tablename__ = "group"
    id: Mapped[int] = mapped_column(primary_key=True)
    name_group: Mapped[str] = mapped_column(nullable=False)
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)
    # связи
    knowledge: Mapped["Knowledge"] = relationship(back_populates="group")

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="group_user")



class Image(Base):
    __tablename__ = "image"

    # Поля таблицы image
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(512), nullable=False)    
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    #связи. В полях таблицы Images будет указываться к какому знанию принадлежит изображение
    knowledge_id: Mapped[int] = mapped_column(ForeignKey("knowledge.id", ondelete="CASCADE"))
    knowledge: Mapped["Knowledge"] = relationship(back_populates="images")



class SavedSearch(Base):
    __tablename__ = "saved_searches"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)    
    name_search: Mapped[str] = mapped_column(nullable=False)    
    search_query: Mapped[str] = mapped_column(nullable=False) # Поисковый запрос
    search_type: Mapped[str] = mapped_column(default="plain") # Тип поиска
    group_slug: Mapped[str] = mapped_column(unique=True, nullable=False) # Группа, в которой выполнялся поиск
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))    
    # Связь с пользователем
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="saved_search_user")
    

# вроде сделал модель для сохранения поиска. Перепроверить... 
# и продумать самому как будет реализовано сохранение поиска, логику продумать
# как сделать так, чтобы именно сами найденные знания сохранились... поисковый запрос тоже норм, но лучше знания сохранять,
# чтобы был аналог сохранения ссылки на знание





# tab_lists (списки вкладок)
# ├── id (PK)
# ├── name
# ├── description
# ├── user_id (FK → users)
# ├── created_at
# └── updated_at

# saved_tab (сохраненные вкладки)
# ├── id (PK) 
# ├── tab_list_id (FK → tab_lists)
# ├── knowledge_id (FK → knowledges)
# ├── position (порядковый номер)
# └── created_at



class Tab_list(Base):
    __tablename__ = "tab_list"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(default="_", nullable=False)
    description: Mapped[str] = mapped_column(default="_")
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"), server_onupdate=text("TIMEZONE('utc', now())"))
    # связи
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="tab_list_user")

    saved_tab_connect: Mapped[List["Saved_tab"]] = relationship(
        back_populates="tab_list_connect", 
        cascade="all, delete-orphan", 
        passive_deletes=True)#убрал , lazy="selectin"


    
class Saved_tab(Base):
    __tablename__ = "saved_tab"
    id: Mapped[int] = mapped_column(primary_key=True)
    position: Mapped[int] = mapped_column(unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    
    # связь с таблистом
    tab_list_id: Mapped[int] = mapped_column(ForeignKey("tab_list.id", ondelete="CASCADE"))
    tab_list_connect: Mapped["Tab_list"] = relationship(back_populates="saved_tab_connect")

    # связь со знаниями
    knowledge_id: Mapped[int] = mapped_column(ForeignKey("knowledge.id", ondelete="CASCADE"))
    knowledge_connect: Mapped["Knowledge"] = relationship(back_populates="saved_tab_connect")

    
    
    
# вроде сделал, перепроверить....


# памятка для миграций БД
#команда для создания ревизиии миграции БД
# alembic revision --autogenerate -m "Table creation"
#команда для запуска миграции:
# alembic upgrade hash
# alembic upgrade head
#hash брать из файла миграции
#head - это значит до самой последней миграции




