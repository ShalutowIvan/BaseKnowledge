import enum

from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, JSON, text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Annotated, Optional
from datetime import datetime
# from ..regusers.models import User

from db_api import Base

class Knowledge(Base):
    __tablename__ = "group"
    id: Mapped[int] = mapped_column(primary_key=True)
    name_group: Mapped[str] = mapped_column(nullable=False)
    slug: Mapped[str] = mapped_column(nullable=False)
    goods: Mapped["Goods"] = relationship(back_populates="group")


class Goods(Base):
    __tablename__ = "goods"
    id: Mapped[int] = mapped_column(primary_key=True)
    name_product: Mapped[str] = mapped_column(nullable=False)
    price: Mapped[float] = mapped_column(default=0)
    vendor_code: Mapped[str] = mapped_column(nullable=False)
    stock: Mapped[float] = mapped_column(nullable=True)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    photo: Mapped[str] = mapped_column(String, nullable=False)
    
    availability: Mapped[bool] = mapped_column(Boolean, nullable=False)# не нужен этот параметр
    time_create: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))#utcnow для разных часовых поясов в случае расположения бд и пользователя в разных часовых поясах, это универсальный часовой пояс. При создании будет автоматом записываться текущее время создания поля.
    # time_create: Mapped[datetime] = mapped_column(default=datetime.utcnow)#это по сути тоже самое, но тут юзается питоновская функция. Что лучше пока не понятно, вроде лучше не юзать питоновскую функцию
    group_id: Mapped[int] = mapped_column(ForeignKey("group.id", ondelete="RESTRICT"))#ссылаемся на таблицу group на ее элемент id
    group: Mapped["Group"] = relationship(back_populates="goods")#тут деалем связь с таблицей групп, чтобы можно было через поле name_group обратиться к объекту группы. То есть чтобы у нас появилась такая связь, чтобы у нас name_group была объектом класса Group, то есть строкой таблицы group, нам нужно прописать relationship(back_populates="groups"), groups это название параметра из таблицы групп, Mapped["Group"] тут Group это класс таблицы группы.
    # и обязательно также указать Column(Integer, ForeignKey("group.id")), то есть нужен вторичный ключ ForeignKey с названием первичного ключа из таблицы групп, в енашем случае это id.
    basket: Mapped["Basket"] = relationship(back_populates="product")
    order_list: Mapped["Order_list"] = relationship(back_populates="product")


class Basket(Base):
    __tablename__ = "basket"
    id: Mapped[int] = mapped_column(primary_key=True)
    
    product_id: Mapped[str] = mapped_column(ForeignKey("goods.id", ondelete="CASCADE"))
    product: Mapped["Goods"] = relationship(back_populates="basket")

    quantity: Mapped[float] = mapped_column(default=1, server_default="1")
    created_timestamp: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="basket")




# lazy="joined" не прописывать в relationship, в самих запросах прописывать их надо , joinedload прописывать нужно


class Organization(Base):
    __tablename__ = "organization"
    id: Mapped[int] = mapped_column(primary_key=True)
    name_org: Mapped[str] = mapped_column(nullable=False)
    inn: Mapped[int] = mapped_column(default=0)
    kpp: Mapped[int] = mapped_column(default=0)
    ogrn: Mapped[int] = mapped_column(default=0)
    working_mode: Mapped[str] = mapped_column(default="_")
    about: Mapped[str] = mapped_column(default="_")
    adres: Mapped[str] = mapped_column(default="_")
    phone: Mapped[int] = mapped_column(default=0)
    email_name: Mapped[str] = mapped_column(nullable=False)
    telegram: Mapped[str] = mapped_column(default="_")
    whatsApp: Mapped[str] = mapped_column(default="_")


# class Pay(enum.Enum):
#     cash = "Наличные"
#     non_cash = "Безналичные"




#способ оплаты
# class Payment(Base):
#     __tablename__ = "payment"
#     id: Mapped[int] = mapped_column(unique=True, primary_key=True)
#     payment_method: Mapped[str] = mapped_column(nullable=False)#тут будет выбор нал или безнал из класса Pay, там указаны перечисления. Пока убрал перечисления, так как выдается ошибка при миграции... (тип "pay" уже существует
# # [SQL: CREATE TYPE pay AS ENUM ('cash', 'non_cash')])
    
#     contacts: Mapped["Contacts"] = relationship(back_populates="payment")

#ранее называлась Contacts
class Order_counter(Base):
    __tablename__ = "order_counter"
    id: Mapped[int] = mapped_column(primary_key=True)    
    user_id: Mapped[int] = mapped_column(nullable=False)
    time_create: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    

class State_order(enum.Enum):
    received = "Получен"
    not_received = "Не получен"


class Order_list(Base):
    __tablename__ = "order_list"
    id: Mapped[int] = mapped_column(primary_key=True)

    # order_number: Mapped[int] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"))
    # order: Mapped["Contacts"] = relationship(back_populates="order_list")
    order_number: Mapped[int] = mapped_column(nullable=False)

    fio: Mapped[str] = mapped_column(nullable=False)
    delivery_address: Mapped[str] = mapped_column(default="_")
    phone: Mapped[str] = mapped_column(default="0")

    product_id: Mapped[int] = mapped_column(ForeignKey("goods.id", ondelete="SET NULL"), nullable=True)
    product: Mapped["Goods"] = relationship(back_populates="order_list")
    # product_id: Mapped[int] = mapped_column(default=0)
    
    quantity: Mapped[float] = mapped_column(nullable=False)
    
    
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    user: Mapped["User"] = relationship(back_populates="order_list")
    
    state: Mapped[bool] = mapped_column(default=True)#это параметр для отображения актуальности заказа. Например если товар удален, то заказ этого товара будет не актуален. Типа нужно заказать другой товар.

    state_order: Mapped[State_order]#этот параметр для отображения получен ли заказ. Класс перечислений enum выше. 
    



# памятка для миграций БД
#команда для создания ревизиии миграции БД
# alembic revision --autogenerate -m "Database creation"
#команда для запуска миграции:
# alembic upgrade hash
# alembic upgrade head
#hash брать из файла миграции
#head - это значит до самой последней миграции




