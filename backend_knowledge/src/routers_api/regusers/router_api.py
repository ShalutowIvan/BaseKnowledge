from fastapi import Form, APIRouter, Depends, HTTPException, Request, Response, status, Cookie, Header
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, PlainTextResponse
from starlette.status import HTTP_404_NOT_FOUND, HTTP_401_UNAUTHORIZED
from sqlalchemy import insert, select, text
from pydantic import BaseModel, Field, EmailStr, validator, UUID4

from src.db import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from src.settings import templates, EXPIRE_TIME, KEY, KEY2, ALG, EXPIRE_TIME_REFRESH, KEY3, KEY4, EXPIRE_TIME_CLIENT_TOKEN, CLIENT_ID

from .models import *
from src.showcase.models import *
from src.showcase.router import base_requisites
from typing import Annotated

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
# OAuth2PasswordRequestForm - это форма для авторизации из фастапи

from .schemas import *

from .secure import pwd_context, create_access_token, create_refresh_token, update_tokens, send_email_verify, send_email_restore_password, create_client_token

import uuid

from jose import JWTError, jwt

from datetime import datetime, timedelta

from jose.exceptions import ExpiredSignatureError




#мой роутер
router_reg_api = APIRouter(
    prefix="/api/regusers",
    tags=["Regusers_api"]
)



#роутеры для реги

# name: str, email: EmailStr, password1: str, password2: str,

@router_reg_api.post("/registration")#response_model это валидация для запроса
async def api_registration_post(request: Request, formData: UserRegShema, session: AsyncSession = Depends(get_async_session) ):

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
        return {"Error": ex}



#это просто подсказка, о том что нужно зайти на почту и перейти по ссылке
# @router_reg_api.get("/verification/check/", response_model=None, status_code=201)
# async def confirm_email(request: Request, session: AsyncSession = Depends(get_async_session)):

#     t = "Перейдите в вашу почту и перейдите по ссылке из письма для подтверждения адреса почты и активации пользователя"
    
#     context = await base_requisites(db=session, request=request)
#     context["t"] = t

#     response = templates.TemplateResponse("regusers/check_email.html", context)
#     return response


#функция обработки ссылки из письма при активации пользака
@router_reg_api.get("/verification/check_user/{token}", status_code=201)
async def api_activate_user(request: Request, token: str, session: AsyncSession = Depends(get_async_session)):
    
    try:
        payload = jwt.decode(token, KEY3, algorithms=[ALG])#в acces_token передается просто строка
        
        user_id = payload.get("sub")#у меня тут user_id
        if user_id is None:
            context = await base_requisites(db=session, request=request)
            return templates.TemplateResponse("showcase/user_not_found.html", context)
            
    
    except Exception as ex:
        # print("!!!!!!!!!!!!!!!!!!!!!!!!!")
        # print(ex)
        context = await base_requisites(db=session, request=request)
        return templates.TemplateResponse("showcase/user_not_found.html", context)
    

    user = await session.scalar(select(User).where(User.id == int(user_id)))
    
    user.is_active = True
    session.add(user)
    await session.commit()
    
    return {"message": "Все супер!"}
    # return RedirectResponse("/regusers/auth/", status_code=303) 


#функция get для страницы забыли пароль
# @router_reg_api.get("/forgot_password/", response_model=None, response_class=HTMLResponse)
# async def forgot_password_get(request: Request, session: AsyncSession = Depends(get_async_session)):
    
#     context = await base_requisites(db=session, request=request)

#     response = templates.TemplateResponse("regusers/forgot_password.html", context)
#     return response


#функция post для страницы забыли пароль
@router_reg_api.post("/forgot_password/")
async def api_forgot_password_post(request: Request, formData: EmailShema, session: AsyncSession = Depends(get_async_session)):
    user = await session.scalar(select(User).where(User.email == formData.email))

    if user is None:        
        return {"message": "Пользователь не найден! Проверьту почту для восстановления пароля!"}

    await send_email_restore_password(user=user)

    # return RedirectResponse("/regusers/restore/pass/", status_code=303)
    return {"message": "Все супер!"}


#это просто подсказка, о том что нужно зайти на почту и перейти по ссылке при сбросе пароля
# @router_reg_api.get("/restore/pass/", response_model=None, status_code=201)
# async def confirm_email_restore_pass(request: Request, session: AsyncSession = Depends(get_async_session)):

#     t = "Перейдите в вашу почту и перейдите по ссылке из письма для восстановления пароля пользователя"
    
#     context = await base_requisites(db=session, request=request)
#     context["t"] = t
#     response = templates.TemplateResponse("regusers/go_to_restore_password.html", context)
#     return response

#тут форма для ввода нового пароля, пароль нужно запрашивать дважды. при реге тоже. регу переделать. Затык с формой опять же.... УРЛ из письма должна запускать форму, а функция для формы должна забирать данные из html. Просто ввод нового пароля без токена не подходит, потому что теряется смысл безопаности и любой у кого есть ссылка напишет почту и новый пароль.

#get запрос для отрисовки страницы формы восстановления пароля....
# @router_reg_api.get("/restore/password_user/{token}")
# async def restore_password_user_get(request: Request, token: str, session: AsyncSession = Depends(get_async_session)):
    
#     context = await base_requisites(db=session, request=request)
#     context["token"] = token

#     response = templates.TemplateResponse("regusers/new_password.html", context)
#     return response


#функция для обработки ссылки из письма для сброса пароля. token автоматом закидывается в форму, и поле с токеном в html сделал невидимым
@router_reg_api.post("/restore/password_user/{token}")
async def api_restore_password_user(request: Request, token: str, formData: ForgotPasswordShema, session: AsyncSession = Depends(get_async_session)):

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
    session.add(user)
    await session.commit()
    
    # return RedirectResponse("/regusers/auth/", status_code=303)
    return {"message": "Все супер!"}


#функция get авторизации
# @router_reg_api.get("/auth", response_model=None, response_class=HTMLResponse)
# async def auth_get(request: Request, session: AsyncSession = Depends(get_async_session)):
    
#     context = await base_requisites(db=session, request=request)

#     response = templates.TemplateResponse("regusers/login.html", context)
#     return response


# form_data: OAuth2PasswordRequestForm = Depends()
# formData: AuthShema
# узнать как прокидывать куки............... пока не знаю как это сделать. Смотреть GPT, там вроде есть инфа
# , response_model=TokenSheme
#функция post авторизации
@router_reg_api.post("/auth")
async def auth_user(response: Response, formData: AuthShema, session: AsyncSession = Depends(get_async_session)):

    email = formData.username#тут у меня почта
    password = formData.password
    

    user: User = await session.scalar(select(User).where(User.email == email))#ищем пользователя по емейл
    
    if not user:        
        return {"message": "Пользователь не зарегистрирован!"}
    
    if not pwd_context.verify(password, user.hashed_password):#сверка пароля с БД                       
        return {"message": "Неверный пароль!"}
        
    if user.is_active != True:        
        return {"message": "Пользователь не активирован! Перейдите по ссылке из письма, которое пришло вам на почту для активации!"}

    
    refresh_token: Token = await session.scalar(select(Token).where(Token.user_id == user.id))
    
    #тут проверка истек ли рефреш токен
    try:
        payload = jwt.decode(refresh_token.refresh_token, KEY2, algorithms=[ALG])        

    except Exception as ex:#если истек рефреш то его просто удаляем, и нужно заново логиниться
        print("РЕФРЕШ ТОКЕН ИСТЕК")
        print(ex)
        if type(ex) == ExpiredSignatureError:            
            await session.delete(refresh_token)
            await session.commit()
            refresh_token = None

    #если рефреш токена нет или он истек, то создаем токены
    if not refresh_token:
        #рефреш токен
        refresh_token_expires = timedelta(minutes=int(EXPIRE_TIME_REFRESH))        
        refresh_token_jwt = create_refresh_token(data={"sub": str(user.id)}, expires_delta=refresh_token_expires)

        #аксес токен
        access_token_expires = timedelta(minutes=int(EXPIRE_TIME))        
        access_token_jwt = create_access_token(data={"sub": str(user.id), "user_name": user.name}, expires_delta=access_token_expires)
        
        #создаем объект рефреш токена
        token: Token = Token(user_id=user.id, refresh_token=refresh_token_jwt)
        session.add(token)       
        # await session.commit()
        # await session.refresh(token)
        # refresh_token: Token = await session.scalar(select(Token).where(Token.user_id == user.id))#перезаписываем в переменную объект рефреш токена, так как нужен именно объект токена
    else:
        refresh_token_jwt = refresh_token.refresh_token
        access_token_expires = timedelta(minutes=int(EXPIRE_TIME))
        access_token_jwt = create_access_token(data={"sub": str(user.id), "user_name": user.name}, expires_delta=access_token_expires)
    
    #логика клиент токена
    client_token: Code_verify_client = await session.scalar(select(Code_verify_client).where(Code_verify_client.user_id == user.id))
    client_token_expires = timedelta(minutes=int(EXPIRE_TIME_CLIENT_TOKEN))        
    client_token_jwt = create_client_token(data={"sub": str(user.id)}, expires_delta=client_token_expires)
    if not client_token:#если в базе нет клиент токена
        client_token: Code_verify_client = Code_verify_client(user_id=user.id, client_token=client_token_jwt)
        session.add(client_token)       
        # await session.commit()
        # await session.refresh(token)
        # refresh_token: Token = await session.scalar(select(Token).where(Token.user_id == user.id))
    else:#иначе присваиваем новый jwt клиента
        client_token.client_token = client_token_jwt
        session.add(client_token)

    await session.commit()


    # response.set_cookie(key="RT", value=refresh_token.refresh_token, httponly=True, secure=True, samesite="lax")
    # response.set_cookie(key="Authorization", value=access_token_jwt, httponly=True, secure=True, samesite="lax")
    # response.set_cookie(key="RT", value=refresh_token_jwt)
    # response.set_cookie(key="Authorization", value=access_token_jwt)
      
    # response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)

    return {"Authorization": access_token_jwt, "RT": refresh_token_jwt, "token_type": "bearer"}



#тут проверка защищенного роута, для теста кук из респонса
def get_current_user2(request: Request):
    session_token = request.cookies.get("Authorization")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Здесь можно добавить логику проверки валидности токена
    # Например, расшифровать токен и проверить его содержимое
    return {"username": "example_user"}  # Возвращаем данные пользователя


@router_reg_api.get("/protected")
async def protected_route(user: dict = Depends(get_current_user2)):
    return {"message": f"Hello, {user['username']}"}



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


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# фукнция для проверки токена
# def verify_access_token(token: str = Depends(oauth2_scheme)):
#     try:
#         payload = jwt.decode(token, KEY, algorithms=[ALG])        
#         user_id = payload.get("sub")#у меня тут user_id, а не юзернейм
#         # user_name = payload.get("user_name")
#         if user_id is None:
#             print("нет такого user_id")            
#             # return [False, None, " "]
#             raise HTTPException(status_code=403, detail="Не валидный токен или истек")#это если токен просто не верный

#     except Exception as ex:#если истек рефреш то его просто удаляем, и нужно заново логиниться
#         print("ОШИБКА ТОКЕНА ТУТ:")
#         print(ex)
#         # if type(ex) == ExpiredSignatureError:            
#         #     await session.delete(refresh_token)
#         #     await session.commit()
#         #     refresh_token = None
#         raise HTTPException(status_code=403, detail="Не валидный токен или истек")

#функция проверки токена.
async def verify_access_token(acces_token: str):#проверка аксес токена из куки , возвращаем тру если токен надо обновить, и фолз если не надо
    
    try:
        payload = jwt.decode(acces_token, KEY, algorithms=[ALG])#в acces_token передается просто строка
        
        user_id = payload.get("sub")#у меня тут user_id, а не юзернейм
        
        if user_id is None:
            print("нет такого user_id")
            # return [False, None, " "]
            return {"res": True}
                
    except Exception as ex:
                
        if type(ex) == ExpiredSignatureError:#если время действия токена истекло, то вывод принта. Можно тут написать логику что будет если аксес токен истекает
            
            print("ОШИБКА АКСЕС ТУТ")
            print(ex)
            # return [ex, None, " "]#если токен истек то это
            return {"res": True}
    
        return {"res": True}#если токена нет вообще, то это возвращается
        
    return {"res": False}



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


# <a href="{{ url_for('url_reg') }}"><h1>РЕГА</h1></a>
#     <br>    
#     <a href="{{ url_for('url_auth') }}"><h1>АУТХ</h1></a>
#     <br>
#     <a href="{{ url_for('test_token') }}"><h1>Проверка токена</h1></a>


