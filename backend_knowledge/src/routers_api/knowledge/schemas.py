# Схемы Pydantic для валидации данных
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime



# схемы изображений
class ImageBaseSchema(BaseModel):
    filename: str
    filepath: str


class ImageCreateSchema(ImageBaseSchema):
    pass


class ImageSchema(ImageBaseSchema):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True



# схема групп знаний

class GroupShema(BaseModel):
    name_group: str = Field(max_length=255)


class GroupShemaFull(GroupShema):
    id: int    
    slug: str = Field(max_length=255)

    class Config:
        from_attributes = True


#это вывода списка знаний. Открыть их по слагу, чтобы была ссылка
class KnowledgesSchema(BaseModel):
    title: str
    description: str
    slug: str


class KnowledgesCreateSchema(BaseModel):
    title: str
    description: str
    group_id: int


class KnowledgesUpdateSchema(BaseModel):
    # title: str
    content: str
    



class KnowledgesSchemaFull(KnowledgesSchema):
    id: int
    content: str
    created_at: datetime
    updated_at: datetime
    images: Optional[list[ImageSchema]] = None
    group_id: int
    free_access: bool

    
    class Config:
        from_attributes = True