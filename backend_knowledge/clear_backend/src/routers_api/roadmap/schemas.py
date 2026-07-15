# Схемы Pydantic для валидации данных
from pydantic import BaseModel, Field, EmailStr, UUID4, validator
from typing import List, Optional
from datetime import datetime
from .models import *



#это вывода списка знаний. Открыть их по ID, чтобы была ссылка
class RoadmapsSchema(BaseModel):
    id: int
    title: str
    description: str    
    created_at: datetime



class RoadmapsCreateSchema(BaseModel):
    title: str
    description: str


class ChaptersSchema(BaseModel):
    id: int
    title: str
    description: str    
    created_at: datetime
    roadmap_id: int


class ChaptersCreateSchema(BaseModel):
    title: str
    description: str



# class ProjectsUpdateSchema(BaseModel):    
#     title: Optional[str] = None
#     description: Optional[str] = None    


class StageSchema(BaseModel):
    id: int
    title: str
    description: str    
    created_at: datetime
    updated_at: datetime
    state: StatesStage
    chapter_id: int


class StageCreateSchema(BaseModel):    
    title: str
    description: str


class StageOpenSchema(StageSchema):
    content: str


class StageUpdateSchema(BaseModel):        
    content: str


class StageChangeHeaderSchema(BaseModel):    
    title: str
    description: str
    state: StatesStage



class StageUpdateHeaderSchema(StageChangeHeaderSchema):
    updated_at: datetime


class StageStateSchema(BaseModel):
    state: StatesStage
    

class StageStateSchemaR(StageStateSchema):    
    updated_at: datetime


# class UserSchema(BaseModel):
#     name: str    
#     email: EmailStr
#     id: int    


# # это валидация словаря для поиска пользователя
# class UsersSearchSchema(BaseModel):
#     user: UserSchema
#     invite: bool


# class User_invite_to_project_schema(BaseModel):    
#     project_id: int
#     user_id: int


# class User_in_project_schema(UserSchema):
#     role: Role


# class User_role_change_schema(User_invite_to_project_schema):        
#     role: Role


# class User_role_schema(BaseModel):
#     role: Role


# class User_project_role_schema(BaseModel):
#     project_id: int
#     # user_id: int
#     # role: Role
