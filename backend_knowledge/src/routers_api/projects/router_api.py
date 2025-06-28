from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie, Form, Body, Header, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
# from sqlalchemy import insert, select, text
# from sqlalchemy.orm import joinedload

from db_api import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession

# from .models import *
from .schemas import *
from .services import *
# from src.regusers.models import User
# from src.regusers.secure import test_token_expire, access_token_decode
import requests




router_project_api = APIRouter(
    prefix="",
    tags=["Project_api"]
)



@router_project_api.get("/project_all/", response_model=list[ProjectsSchema])
async def projects_all(session: AsyncSession = Depends(get_async_session)) -> ProjectsSchema:
    return await get_projects(db=session)


# , response_model=ProjectsSchema
@router_project_api.post("/project_create/")
async def project_create(request: Request, project: ProjectsCreateSchema, session: AsyncSession = Depends(get_async_session)):    
    return await project_create_service(request=request, db=session, project=project)





