# Схемы Pydantic для валидации данных
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime



# схемы изображений
class ImageBaseSchema(BaseModel):
    filename: str
    filepath: str


class ImageCreateSchema(ImageBase):
    pass


class ImageSchema(ImageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True



# схема групп знаний
class GroupShema(BaseModel):
    id: int
    name_group: str = Field(max_length=255)
    slug: str = Field(max_length=255)

    class Config:
        from_attributes = True


#это вывода списка знаний. Открыть их по слагу, чтобы была ссылка
class KnowledgesSchema(BaseModel):
    title: str
    description: str
    # slug: str


class KnowledgesCreateSchema(PostBase):
    pass


class KnowledgesSchemaFull(KnowledgesSchema):
    id: int
    content: str
    created_at: datetime
    updated_at: Optional[datetime]
    images: Optional[list[Image]] = None
    
    
    class Config:
        from_attributes = True