from pydantic import BaseModel, Field, EmailStr, validator, UUID4
from typing import Optional
from datetime import datetime



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
