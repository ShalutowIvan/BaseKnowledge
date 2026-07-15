from fastapi import Form, APIRouter, Depends, HTTPException, Request, Response, status, Cookie, Header
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
from starlette.status import HTTP_404_NOT_FOUND, HTTP_401_UNAUTHORIZED
from sqlalchemy import insert, select, text
from pydantic import BaseModel, Field, EmailStr, validator, UUID4

from db_api import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from settings import EXPIRE_TIME, KEY, KEY2, ALG, EXPIRE_TIME_REFRESH, KEY3, KEY4, EXPIRE_TIME_CLIENT_TOKEN, CLIENT_ID


from .models import *
# from src.showcase.router import base_requisites
from typing import Annotated

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
# OAuth2PasswordRequestForm - это форма для авторизации из фастапи

from .schemas import *

from .secure import pwd_context, create_access_token, create_refresh_token, update_tokens, send_email_verify, send_email_restore_password, create_client_token

from .auth_service import *

import uuid
# вместо jose теперь юзаю PyJWT
# from jose import JWTError, jwt
import jwt

from datetime import datetime, timedelta

# from jose.exceptions import ExpiredSignatureError

from middleware.rate_limiter import limiter




#мой роутер
router_reg_api = APIRouter(
    prefix="/api/regusers",
    tags=["Regusers_api"]
)



#роутеры для реги

@router_reg_api.post("/registration")#response_model это валидация для запроса
@limiter.limit("3/hour")
async def api_registration_post(request: Request, formData: UserRegSchema, session: AsyncSession = Depends(get_async_session) ):

    name = formData.name
    email = formData.email
    password1 = formData.password1
    password2 = formData.password2

    try:

        check_user_in_db = await session.scalar(select(User).where(User.email == email))
        if check_user_in_db:
            return {"message": "Пользователь уже зарегистрирован"}
        
        if password1 != password2:            
            return {"message": "Пароли не совпадают!"}
            

        if len(password1) < 8 or password1.lower() == password1 or password1.upper() == password1 or not any(i.isdigit() for i in password1) or all(i.isdigit() for i in password1):            
            return {"message": "Пароль должен быть не менее 8 символов и должен содержать заглавные, строчные буквы и цифры!"}

        user = User(name=name, email=email, hashed_password=pwd_context.hash(password1))

        session.add(user)
        await session.commit()

        await send_email_verify(user=user)#в этой функции нужно зашифровать пользака и потом дешифровать
        
        return {"message": "Все супер!"}
    except Exception as ex:
        print("Ошибка при регистрации: ", ex)
        return {"Error": ex}


#функция обработки ссылки из письма при активации пользака
@router_reg_api.get("/verification/check_user/{token}", status_code=201)
async def api_activate_user(request: Request, token: str, session: AsyncSession = Depends(get_async_session)):
    
    try:
        payload = jwt.decode(token, KEY3, algorithms=[ALG])#в acces_token передается просто строка        
        user_id = payload.get("sub")#у меня тут user_id    
    except Exception as ex:        
        print(ex)            

    user = await session.scalar(select(User).where(User.id == int(user_id)))
    
    user.is_active = True
    session.add(user)
    await session.commit()
    
    return {"message": "Все супер!"}
    

#функция post для страницы забыли пароль
@router_reg_api.post("/forgot_password/")
async def api_forgot_password_post(request: Request, formData: EmailSchema, session: AsyncSession = Depends(get_async_session)):
    user = await session.scalar(select(User).where(User.email == formData.email))

    if user is None:        
        return {"message": "Пользователь не найден! Проверьту почту для восстановления пароля!"}

    await send_email_restore_password(user=user)

    # return RedirectResponse("/regusers/restore/pass/", status_code=303)
    return {"message": "Все супер!"}



#тут форма для ввода нового пароля, пароль нужно запрашивать дважды. при реге тоже. регу переделать. Затык с формой опять же.... УРЛ из письма должна запускать форму, а функция для формы должна забирать данные из html. Просто ввод нового пароля без токена не подходит, потому что теряется смысл безопаности и любой у кого есть ссылка напишет почту и новый пароль.

#функция для обработки ссылки из письма для сброса пароля. token автоматом закидывается в форму, и поле с токеном в html сделал невидимым
@router_reg_api.post("/restore/password_user/{token}")
async def api_restore_password_user(request: Request, token: str, formData: ForgotPasswordSchema, session: AsyncSession = Depends(get_async_session)):

    password1 = formData.password1
    password2 = formData.password2

    try:
        payload = jwt.decode(token, KEY4, algorithms=[ALG])
        user_id = payload.get("sub")
        if user_id is None:            
            return {"message": "Ошибка, скорее всего нет такого пользователя!"}

    except Exception as ex:        
        return {"message": f"Ошибка: {ex}"}

    if password1 != password2:        
        return {"message": "Пароли не совпадают! Перейдите по ссылке из письма повторно и повторите попытку ввода нового пароля!"}

    if len(password1) < 8 or password1.lower() == password1 or password1.upper() == password1 or not any(i.isdigit() for i in password1) or all(i.isdigit() for i in password1):        
        return {"message": "Пароль должен быть не менее 8 символов и должен содержать заглавные, строчные буквы и цифры! Перейдите по ссылке из письма повторно и повторите попытку ввода нового пароля!"}

    user = await session.scalar(select(User).where(User.id == int(user_id)))
    if user is None:        
        return {"message": "Пользователь не найден! Перейдите по ссылке из письма повторно и повторите попытку ввода нового пароля!"}

    user.hashed_password = pwd_context.hash(password1)
    user.requires_password_reset = False
    session.add(user)
    await session.commit()
    
    # return RedirectResponse("/regusers/auth/", status_code=303)
    return {"message": "Все супер!"}


#функция post авторизации
@router_reg_api.post("/auth")
async def auth_user(response: Response, formData: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_async_session)):    
    return await auth_user_service(session=session, formData=formData)



# лишние функции
# #тут проверка защищенного роута, для теста кук из респонса
# def get_current_user2(request: Request):
#     session_token = request.cookies.get("Authorization")
#     if not session_token:
#         raise HTTPException(status_code=401, detail="Not authenticated")
#     # Здесь можно добавить логику проверки валидности токена
#     # Например, расшифровать токен и проверить его содержимое
#     return {"username": "example_user"}  # Возвращаем данные пользователя


# @router_reg_api.get("/protected")
# async def protected_route(user: dict = Depends(get_current_user2)):
#     return {"message": f"Hello, {user['username']}"}



    # return {"message": "Все супер"}
# возврат сделать токена....
# эрик роби. в фастапи есть урл где он вводит логин и пароль и сверяет их с БД, и возвращает юзера.
# затем создает токен и его возвращает также в виде словаря. 
# Типа - {токен: значение токена, тип токена: бэрэр}.
# сначала он берет данные с фронта логин пас, с помощью formData: OAuth2PasswordRequestForm = Depends()
# сверяет их с БД с помощью отдельной функции
# делает проверку юзера, есть он или нет, то есть сверка логина паса прошла или нет
# потом создает токен и закидывает в пейлоад токена юзернейм
# и его возвращает также в виде словаря. 
# Типа - {токен: значение токена, тип токена: бэрэр}.
# затем создает еще одну функцию для проверки токена, что он валидный. Декодирует, проверяет что в нем есть юзернейм.
# def verify_token(token: str = Depends(oauth2scheme)) так пишет начало функции
# потом делает роут с параметром и там запускает эту функцию
# у него в фронте токен сохраняется в локальное хранилище
# и там если токен будет не верный, то он удаляется. Это логика фронта

# это вариант без куки выше
# не понятно как установить куку в заголовок


# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



# , response_model=TokenSheme
#роутер для проверки аксес токена - пока не использую
@router_reg_api.get("/auth/verify_access_token/{token}")
async def uri_verify_access_token(response: Response, token: str):
    res = await verify_access_token(acces_token=token)

    return res


# роут для обновления аксес по рефрешу
@router_reg_api.get("/auth/update_access_token/{refreshToken}")
async def uri_update_access_token(response: Response, refreshToken: str, session: AsyncSession = Depends(get_async_session)):
    tokens = await update_tokens(RT=refreshToken, db=session)
    return {"Authorization": tokens[1], "token_type": "bearer", "refresh_token": tokens[0]}








# @router_reg_api.get("/logout")
# async def logout_user(request: Request, response: Response, Authorization: str | None = Cookie(default=None), RT: str | None = Cookie(default=None), session: AsyncSession = Depends(get_async_session)):
    
#     context = await base_requisites(db=session, request=request)

#     response = templates.TemplateResponse("regusers/login.html", context)
    
#     if RT != None:
#         us_token: Token = await session.scalar(select(Token).where(Token.refresh_token == RT))
#         if us_token:
#             await session.delete(us_token)
#             await session.commit()
#         response.delete_cookie("RT")
#         response.delete_cookie("Authorization")

#     return response
    





# #функция проверки токена из кук. Пока роуты без схем, нужно сделать со схемами пайдентика
# @router_reg_api.get("/self", response_model=None)
# async def test_token(request: Request, RT: str | None = Cookie(default=None), session: AsyncSession = Depends(get_async_session)):
    
#     response = templates.TemplateResponse("regusers/test2.html", {"request": request})
    
#     return response
    

    
    




################################################################################
#просто ссылки для перехода на страницу тестовой авторизации. Потом удалить.
# @router_reg_api.get("/registration")
# async def url_reg(request: Request):
#     pass
#     # return RedirectResponse("/auth", status_code=303)


# @router_reg_api.get("/auth")
# async def url_auth(request: Request):
#     pass
    # return RedirectResponse("", status_code=303)
################################################################################




# функции активации
@router_reg_api.get("/activation/", status_code=201)
async def api_activate_user(request: Request, token: str, session: AsyncSession = Depends(get_async_session)):
    
    try:
        payload = jwt.decode(token, KEY3, algorithms=[ALG])#в acces_token передается просто строка        
        user_id = payload.get("sub")#у меня тут user_id    
    except Exception as ex:        
        print(ex)
            

    user = await session.scalar(select(User).where(User.id == int(user_id)))
    
    user.is_active = True
    session.add(user)
    await session.commit()
    
    return {"message": "Все супер!"}
    
