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



# class ProjectsCreateSchema(BaseModel):
#     title: str
#     description: str


# class SectionsSchema(BaseModel):
#     id: int
#     title: str
#     description: str    
#     created_at: datetime
#     project_id: int


# class SectionsCreateSchema(BaseModel):
#     title: str
#     description: str



# class ProjectsUpdateSchema(BaseModel):    
#     title: Optional[str] = None
#     description: Optional[str] = None    


# class TasksSchema(BaseModel):
#     id: int
#     title: str
#     description: str    
#     created_at: datetime
#     updated_at: datetime
#     state: StatesTask
#     section_id: int


# class TaskCreateSchema(BaseModel):
#     # id: int
#     title: str
#     description: str


# class TaskOpenSchema(TasksSchema):
#     content: str


# class TaskUpdateSchema(BaseModel):        
#     content: str


# class TaskUpdateHeaderSchema(TaskCreateSchema):
#     updated_at: datetime


# class TaskStateSchema(BaseModel):
#     state: StatesTask
    

# class TaskStateSchemaR(TaskStateSchema):    
#     updated_at: datetime


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
