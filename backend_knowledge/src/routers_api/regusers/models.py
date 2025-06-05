from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, Float, Boolean, Text, Table, Column, DateTime, text
from sqlalchemy.dialects.postgresql import UUID

from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db_api import Base


class User(Base):
    __tablename__ = "user"
    # id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id: Mapped[int] = mapped_column(primary_key=True, index=True)#пока так, если что потом заменить на uuid
    name: Mapped[str] = mapped_column(String(256))
    time_create_user: Mapped[datetime] = mapped_column(server_default=text("TIMEZONE('utc', now())"))
    email: Mapped[str] = mapped_column(String(length=320), unique=True, index=True, nullable=False)
    # phone: Mapped[str] = mapped_column(String(length=320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(length=1024), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=False, nullable=False)

    #связи
    knowledge_user: Mapped["Knowledges"] = relationship(back_populates="user")
    tokens: Mapped["Token"] = relationship(back_populates="user")
    # basket: Mapped["Basket"] = relationship(back_populates="user")
    # order_list: Mapped["Order_list"] = relationship(back_populates="user")
    # # order_counter: Mapped["Order_counter"] = relationship(back_populates="user")
    client_generate: Mapped["Code_verify_client"] = relationship(back_populates="user")


class Token(Base):
    __tablename__ = "token"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    refresh_token = mapped_column(String(length=320), unique=True, index=True, nullable=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    
    user: Mapped["User"] = relationship(back_populates="tokens")


#таблица с токеном клиента, тут зашифрованный client_token в виде jwt. Время жизни будет сутки, для боевого режима примерно час. Без клиент токена нужно заново логиниться
class Code_verify_client(Base):
    __tablename__ = "verify_client"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_token: Mapped[str] = mapped_column(String(length=320), unique=True, index=True, nullable=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    
    user: Mapped["User"] = relationship(back_populates="client_generate")

