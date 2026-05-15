from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
from fastapi import Depends, HTTPException, Request, Response, status, Cookie, Header
from .models import *
from .secure import pwd_context, create_access_token, create_refresh_token, update_tokens, send_email_verify, send_email_restore_password, create_client_token
import jwt
from settings import EXPIRE_TIME, KEY, KEY2, ALG, EXPIRE_TIME_REFRESH, KEY3, KEY4, EXPIRE_TIME_CLIENT_TOKEN, CLIENT_ID
from datetime import datetime, timedelta
from sqlalchemy import insert, select, text



async def auth_user_service(session: AsyncSession, formData: OAuth2PasswordRequestForm):
	email = formData.username#тут у меня почта
	password = formData.password    

	user: User = await session.scalar(select(User).where(User.email == email))#ищем пользователя по емейл

	if not user:
	    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username")

	if user.requires_password_reset == True:
	    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You need to change your password. Use the forgot password function.")


	if not pwd_context.verify(password, user.hashed_password):#сверка пароля с БД                       
	    # return {"message": "Неверный пароль!"}
	    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
	    
	if user.is_active != True:        
	    # return {"message": "Пользователь не активирован! Перейдите по ссылке из письма, которое пришло вам на почту для активации!"}
	    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

	refresh_token: Token = await session.scalar(select(Token).where(Token.user_id == user.id))

	#тут проверка истек ли рефреш токен
	try:
	    payload = jwt.decode(refresh_token.refresh_token, KEY2, algorithms=[ALG])        

	except Exception as ex:#если истек рефреш то его просто удаляем, и нужно заново логиниться
	    print("РЕФРЕШ ТОКЕН ИСТЕК")
	    print(ex)
	    if type(ex) == jwt.ExpiredSignatureError:            
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
	    access_token_jwt = create_access_token(data={"sub": str(user.id), "user_name": user.name, "active": user.service_active, "role": user.user_role}, expires_delta=access_token_expires)
	    
	    #создаем объект рефреш токена
	    token: Token = Token(user_id=user.id, refresh_token=refresh_token_jwt)
	    session.add(token)       
	    # await session.commit()
	    # await session.refresh(token)
	    # refresh_token: Token = await session.scalar(select(Token).where(Token.user_id == user.id))#перезаписываем в переменную объект рефреш токена, так как нужен именно объект токена
	else:
	    refresh_token_jwt = refresh_token.refresh_token
	    access_token_expires = timedelta(minutes=int(EXPIRE_TIME))
	    access_token_jwt = create_access_token(data={"sub": str(user.id), "user_name": user.name, "active": user.service_active, "role": user.user_role}, expires_delta=access_token_expires)

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
                
        if type(ex) == jwt.ExpiredSignatureError:#если время действия токена истекло, то вывод принта. Можно тут написать логику что будет если аксес токен истекает
            
            print("ОШИБКА АКСЕС ТУТ")
            print(ex)
            # return [ex, None, " "]#если токен истек то это
            return {"res": True}
    
        return {"res": True}#если токена нет вообще, то это возвращается
        
    return {"res": False}