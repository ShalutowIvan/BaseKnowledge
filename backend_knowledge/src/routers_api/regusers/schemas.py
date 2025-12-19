from pydantic import BaseModel, Field, EmailStr, validator, UUID4
from typing import Optional, Any
from datetime import datetime
from .models import ActivationCode, UserRole


class UserRegShema(BaseModel):
    name: str
    email: EmailStr
    password1: str
    password2: str


class ForgotPasswordShema(BaseModel):
    password1: str
    password2: str


class EmailShema(BaseModel):
    email: EmailStr

    class Config:
        from_attributes = True


class AuthShema(BaseModel):
    username: EmailStr#тут почта,а не имя пользака
    password: str


class TokenSheme(BaseModel):
    Authorization: str
    RT: str
    token_type: str
    # live_time: int

class AccessTokenSheme(BaseModel):
    Authorization: str
    token_type: str

class UserSheme(BaseModel):
    id: str
    username: str    
    # email: str
    # disabled: bool = False


# class UserAuth(BaseModel):
#     # id: UUID4
#     # id: int
#     # name: str
#     # time_create_user: datetime
#     email: EmailStr
#     password: str
#     # is_active: bool = True
    

# class UserCreate(BaseModel):
#     id: int
#     name: str
#     # time_create_user: datetime
#     email: EmailStr
#     password: str
#     is_active: Optional[bool] = True

#     class Config:
#         orm_mode = True
    


# class MailBody(BaseModel):
#     to: list[str]
#     subject: str
#     body: str



# Схемы для кодов активации и админки

class ActivationCodeBase(BaseModel):
    code: str
    note: Optional[str] = None


class ActivationCodeCreate(ActivationCodeBase):
    days_valid: int = 30
    
    @validator('days_valid')
    def validate_days(cls, v):
        if v < 1 or v > 365:
            raise ValueError('Срок действия должен быть от 1 до 365 дней')
        return v


class ActivationCodeResponse(BaseModel):
    id: int
    code: str
    status: str
    created_at: datetime
    expires_at: datetime
    updated_at: datetime
    created_by: int
    used_id: Optional[int] = None

    class Config:
        from_attributes = True

        


class ActivationCodeWithUserResponse(ActivationCodeResponse):
    """Схема для кода активации с email пользователя"""
    
    
    activated_user: Optional[EmailShema] = None


    # class Config:
    #     from_attributes = True

    

class ActivateAccountRequest(BaseModel):
    user_id: int
    code: str    
    
    # @validator('code')
    # def clean_code(cls, v):
    #     # Убираем пробелы и приводим к верхнему регистру
    #     v = v.strip().upper().replace(' ', '')
        
    #     # Добавляем дефис если его нет
    #     if len(v) == 8 and '-' not in v:
    #         v = f"{v[:4]}-{v[4:]}"
        
    #     return v
        

class BulkCreateCodesRequest(BaseModel):
    count: int = 10
    days_valid: int = 30
    
    @validator('count')
    def validate_count(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Количество кодов должно быть от 1 до 100')
        return v



class PaginatedResponseCodes(BaseModel):
    items: list[ActivationCodeWithUserResponse]   # Список элементов текущей страницы
    total: int                      # ОБЩЕЕ количество элементов во всей таблице
    page: int                       # Текущая страница
    per_page: int                   # Количество элементов на странице
    total_pages: int                # ОБЩЕЕ количество страниц
    has_next: bool                  # Есть ли следующая страница
    has_prev: bool                  # Есть ли предыдущая страница
    first_item: int | None          # ID первого элемента на странице
    last_item: int | None           # ID последнего элемента на странице


class ChangeUserSchema(BaseModel):
    name: str
    email: EmailStr
    user_role: UserRole


# сделать схему для юзера после редактирования ост тут!!!!!!!!!!

