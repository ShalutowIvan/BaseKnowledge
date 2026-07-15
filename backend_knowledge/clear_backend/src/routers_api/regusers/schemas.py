from pydantic import BaseModel, Field, EmailStr, validator, UUID4
from typing import Optional, Any
from datetime import datetime
from .models import ActivationCode, UserRole



class UserRegSchema(BaseModel):
    name: str
    email: EmailStr
    password1: str
    password2: str


class ForgotPasswordSchema(BaseModel):
    password1: str
    password2: str


class EmailSchema(BaseModel):
    email: EmailStr

    class Config:
        from_attributes = True


class AuthSchema(BaseModel):
    username: EmailStr#тут почта,а не имя пользака
    password: str


class TokenSchema(BaseModel):
    Authorization: str
    RT: str
    token_type: str
    # live_time: int

class AccessTokenSchema(BaseModel):
    Authorization: str
    token_type: str

class UserSchema(BaseModel):
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
    
    
    activated_user: Optional[EmailSchema] = None


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



class PaginatedResponse(BaseModel):
    # items: list[ActivationCodeWithUserResponse]   # Список элементов текущей страницы
    total: int                      # ОБЩЕЕ количество элементов во всей таблице
    page: int                       # Текущая страница
    per_page: int                   # Количество элементов на странице
    total_pages: int                # ОБЩЕЕ количество страниц
    has_next: bool                  # Есть ли следующая страница
    has_prev: bool                  # Есть ли предыдущая страница
    first_item: int | None          # ID первого элемента на странице
    last_item: int | None           # ID последнего элемента на странице


class PaginatedResponseCodes(PaginatedResponse):
    items: list[ActivationCodeWithUserResponse]


class UsersSchema(BaseModel):
    id: int
    name: str
    time_create_user: datetime
    email: EmailStr
    is_active: bool
    user_role: UserRole
    service_active: bool

    class Config:
        from_attributes = True


class PaginatedResponseUsers(PaginatedResponse):
    items: list[UsersSchema]


class ChangeUserSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    user_role: Optional[UserRole] = None




