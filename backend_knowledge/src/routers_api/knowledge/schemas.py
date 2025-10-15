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






class DeleteGroupRequest(BaseModel):
    move_to_group: Optional[int] = None



# схема групп знаний

class GroupShema(BaseModel):
    name_group: str = Field(max_length=255)


class GroupShemaFull(GroupShema):
    id: int    
    slug: str = Field(max_length=255)

    class Config:
        from_attributes = True


#это вывода списка знаний. Открыть их по ID, чтобы была ссылка
class KnowledgesSchema(BaseModel):
    id: int
    title: str
    description: str

    class Config:
        from_attributes = True

    


class KnowledgesCreateSchema(BaseModel):
    title: str
    description: str    
    group_id: int
    # group_slug: str


class KnowledgesUpdateSchema(BaseModel):        
    content: str
    

class KnowledgesUpdateHeaderSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None    
    free_access: Optional[bool] = None
    group_id: int


class KnowledgesUpdateHeaderResponseSchema(BaseModel):
    title: str
    description: str
    free_access: bool
    updated_at: datetime
    slug: str
    group: GroupShemaFull



class KnowledgesSchemaFull(KnowledgesSchema):    
    content: str
    created_at: datetime
    updated_at: datetime
    images: Optional[List[ImageBaseSchema]] = None    
    group_id: int    
    free_access: bool
    slug: str

    
    class Config:
        from_attributes = True

class KnowledgesSchemaOpen(KnowledgesSchemaFull):
    group: Optional[GroupShema] = None    



# схема пагинации
class PaginatedResponse(BaseModel):
    items: list[KnowledgesSchema]   # Список элементов текущей страницы
    total: int                      # ОБЩЕЕ количество элементов во всей таблице
    page: int                       # Текущая страница
    per_page: int                   # Количество элементов на странице
    total_pages: int                # ОБЩЕЕ количество страниц
    has_next: bool                  # Есть ли следующая страница
    has_prev: bool                  # Есть ли предыдущая страница
    first_item: int | None          # ID первого элемента на странице
    last_item: int | None           # ID последнего элемента на странице



# схемы для сохранения поискового запроса
class SavedSearchBaseSchema(BaseModel):
    name_search: str
    search_query: str
    search_type: str = "plain"
    group_slug: str


class SavedSearchCreateSchema(SavedSearchBaseSchema):
    pass
    

class SavedSearchResponseSchema(SavedSearchBaseSchema):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True



# схемы сохраненных вкладок табов


# schemas.py

class SavedTabBaseSchema(BaseModel):
    knowledge_id: int
    position: int  # Позиция во вкладках


class SavedTabCreateSchema(SavedTabBaseSchema):
    pass


class SavedTabSchema(SavedTabBaseSchema):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TabListBaseSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None


class TabListCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    active_tabs: List[int]# это список из id знаний которые открыты во вкладках



class TabListSchema(TabListBaseSchema):    
    created_at: datetime
    updated_at: datetime    
    
    class Config:
        from_attributes = True




