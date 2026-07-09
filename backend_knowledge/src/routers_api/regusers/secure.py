import uuid
from typing import Annotated

from fastapi import HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.status import HTTP_404_NOT_FOUND
from starlette.status import HTTP_400_BAD_REQUEST

from .models import User, Token, Code_verify_client


from fastapi.security import APIKeyHeader, APIKeyCookie, OAuth2PasswordBearer


from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
# from passlib.context import CryptContext
# from passlib.hash import argon2

# вместо jose теперь юзаю PyJWT
# from jose import JWTError, jwt
import jwt#это PyJWT
from settings import KEY, KEY2, ALG, EXPIRE_TIME, EXPIRE_TIME_REFRESH, KEY3, KEY4, KEY5, EXPIRE_TIME_CLIENT_TOKEN
from datetime import datetime, timedelta
# from jose.exceptions import ExpiredSignatureError

#импорты для отправки почты
from settings import PORT, HOST, HOST_USER, HOST_PASSWORD, DEFAULT_EMAIL
from ssl import create_default_context
from email.mime.text import MIMEText
from smtplib import SMTP
from pydantic import EmailStr


#вариант хеширования с passlib с bcrypt
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# вариант с новой схемой хеширования. Он более удобен и безопасен. Тоже можно настривать "Соль"
# pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
pwd_context = PasswordHash(
    [
        Argon2Hasher(
            time_cost=3,
            memory_cost=65536,
            parallelism=4
        )
    ]
)


#вариант хеширования и проверки пароля с passlib с argon2 через прямой доступ к from passlib.hash import argon2
# Хеширование пароля
# def hash_password(password: str) -> str:
#     # Аргументы (можно настроить под свои нужды):
#     # time_cost – количество итераций (по умолчанию 3)
#     # memory_cost – использование памяти в KiB (по умолчанию 65536)
#     # parallelism – количество потоков (по умолчанию 4)
#     hashed = argon2.hash(
#         password,
#         time_cost=3,       # Увеличивайте для большей безопасности (но медленнее)
#         memory_cost=65536, # 64MB
#         parallelism=4      # Количество ядер
#     )
#     return hashed

# # Проверка пароля
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     try:
#         return argon2.verify(plain_password, hashed_password)
#     except Exception as e:
#         print(f"Ошибка проверки пароля: {e}")
#         return False



# apikey_scheme = APIKeyCookie(name="Authorization")

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")#это проверка токена на валидность


#статья про jwt на хабре
# https://habr.com/ru/articles/340146/
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:#если задано время истекания токена, то к текущему времени мы добавляем время истекания
        expire = datetime.utcnow() + expires_delta
    #expires_delta это если делать какую-то
    else:#иначе задаем время истекания также 30 мин
        expire = datetime.utcnow() + timedelta(minutes=int(EXPIRE_TIME))#протестить длительность токена с 0 минут
    to_encode.update({"exp": expire})#тут мы добавили элемент в словарь который скопировали выше элемент с ключом "exp" и значением времени, которое сделали строкой выше. 
    encoded_jwt = jwt.encode(to_encode, KEY, algorithm=ALG)#тут мы кодируем наш токен.
    return encoded_jwt



def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:#если задано время истекания токена, то к текущему времени мы добавляем время истекания
        expire = datetime.utcnow() + expires_delta
    #expires_delta это если делать какую-то
    else:#иначе задаем время истекания также 30 мин
        expire = datetime.utcnow() + timedelta(minutes=int(EXPIRE_TIME_REFRESH))#протестить длительность токена с 0 минут
    to_encode.update({"exp": expire})#тут мы добавили элемент в словарь который скопировали выше элемент с ключом "exp" и значением времени, которое сделали строкой выше. 
    encoded_jwt = jwt.encode(to_encode, KEY2, algorithm=ALG)#тут мы кодируем наш токен.
    return encoded_jwt



def create_client_token(data: dict, expires_delta: timedelta | None = None):
	to_encode = data.copy()
	if expires_delta:#если задано время истекания токена, то к текущему времени мы добавляем время истекания
		expire = datetime.utcnow() + expires_delta
    #expires_delta это если делать какую-то
	else:#иначе задаем время истекания также 30 мин
		expire = datetime.utcnow() + timedelta(minutes=int(EXPIRE_TIME_CLIENT_TOKEN))#протестить длительность токена с 0 минут
	to_encode.update({"exp": expire})#тут мы добавили элемент в словарь который скопировали выше элемент с ключом "exp" и значением времени, которое сделали строкой выше. 
	encoded_jwt = jwt.encode(to_encode, KEY5, algorithm=ALG)#тут мы кодируем наш токен.
	return encoded_jwt


# эту функцию использую в роутере при обновлении токенов
async def update_tokens(RT, db):#передаем сюда рефреш токен и сессию с ДБ
	#расшифровка рефреш токена
	try:
		payload = jwt.decode(RT, KEY2, algorithms=[ALG])
		pl_id = payload.get("sub")
		# pl_email = payload.get("iss")		
		# print(pl_id)

	except Exception as ex:#если истек рефреш то его просто удаляем, и нужно заново логиниться
		print("ОШИБКА ОБНОВЛЕНИЯ РЕФРЕШ ТОКЕНА ТУТ!!!!!!!!!")
		print(ex)
		if type(ex) == jwt.ExpiredSignatureError:
			us_token: Token = await db.scalar(select(Token).where(Token.refresh_token == RT))
			if us_token:
				await db.delete(us_token)
				await db.commit()
		
		return [False, False]

    #создаем новый рефреш и аксес. Данные для создания токенов берем из декодированного токена из пейлоада
        
    #проверка совпадает ли токен из кук с базой для безопасности, в случае если злоумышленник обновил уже токен, а мы нет, то все токены должны удалиться
	RT_in_db: Token = await db.scalar(select(Token).where(Token.refresh_token == RT))#ищем рефреш в ДБ по токену из кук
	
	# print(RT_in_db)
	if not RT_in_db:
		tk: Token = await db.scalar(select(Token).where(Token.user_id == int(pl_id)))#ищем токен по ID пользака и удаляем его, это от мошенников чтобы их обезвредить
		client_token: Code_verify_client = await db.scalar(select(Code_verify_client).where(Code_verify_client.user_id == int(pl_id)))
		if tk:
			await db.delete(tk)
			if client_token:
				await db.delete(client_token)				
			
			await db.commit()
			# await db.refresh(tk)

		print("Токен не совпадает с базой!!!!!!!")
		return [False, False]

	#если токен совпал с базой, то мы обновляем оба токена
	#рефреш токен
	refresh_token_expires = timedelta(minutes=int(EXPIRE_TIME_REFRESH))    
	refresh_token_jwt = create_refresh_token(data={"sub": str(pl_id)}, expires_delta=refresh_token_expires)

	#аксес токен
	user: User = await db.scalar(select(User).where(User.id == int(pl_id)))
	access_token_expires = timedelta(minutes=int(EXPIRE_TIME))
	access_token_jwt = create_access_token(data={"sub": pl_id, "user_name": user.name, "active": user.service_active, "role": user.user_role}, expires_delta=access_token_expires)

	#обновляем рефреш в базе	
	new_RT: Token = Token(user_id=int(pl_id), refresh_token=refresh_token_jwt)#для создания объекта нужен Ид пользака

	await db.delete(RT_in_db)
	db.add(new_RT)
	await db.commit()
	await db.refresh(new_RT)

	return [refresh_token_jwt, access_token_jwt]



#функция для обновления аксес по рефрешу, без обновления рефреш. Не используется
async def update_acces_token(RT, db):#передаем сюда рефреш токен и сессию с ДБ
	#расшифровка рефреш токена
	try:
		payload = jwt.decode(RT, KEY2, algorithms=[ALG])
		pl_id = payload.get("sub")		

	except Exception as ex:#если истек рефреш то его просто удаляем, и нужно заново логиниться
		print("ОШИБКА ОБНОВЛЕНИЯ ТОКЕНА ТУТ!!!!!!!!!")
		print(ex)
		if type(ex) == jwt.ExpiredSignatureError:
			us_token: Token = await db.scalar(select(Token).where(Token.refresh_token == RT))
			if us_token:
				await db.delete(us_token)
				await db.commit()
		
		return False

    #создаем новый рефреш и аксес. Данные для создания токенов берем из декодированного токена из пейлоада
        
    #проверка совпадает ли токен из кук с базой для безопасности, в случае если злоумышленник обновил уже токен, а мы нет, то все токены должны удалиться
	RT_in_db: Token = await db.scalar(select(Token).where(Token.refresh_token == RT))#ищем рефреш в ДБ по токену из кук	
	
	if not RT_in_db:
		tk: Token = await db.scalar(select(Token).where(Token.user_id == int(pl_id)))#ищем токен по ID пользака и удаляем его, это мошенников чтобы их обезвредить
		if tk:
			await db.delete(tk)
			await db.commit()
			# await db.refresh(tk)
		print("Токен не совпадает с базой!!!!!!!")
		return False

	#если токен совпал с базой, то мы обновляем оба токена
	# #рефреш токен
	# refresh_token_expires = timedelta(minutes=int(EXPIRE_TIME_REFRESH))    
	# refresh_token_jwt = create_refresh_token(data={"sub": str(pl_id)}, expires_delta=refresh_token_expires)

	#аксес токен
	user: User = await db.scalar(select(User).where(User.id == int(pl_id)))
	access_token_expires = timedelta(minutes=int(EXPIRE_TIME))
	access_token_jwt = create_access_token(data={"sub": pl_id, "user_name": user.name}, expires_delta=access_token_expires)

	#обновляем рефреш в базе	
	# new_RT: Token = Token(user_id=int(pl_id), refresh_token=refresh_token_jwt)#для создания объекта нужен Ид пользака

	# await db.delete(RT_in_db)
	# db.add(new_RT)
	# await db.commit()
	# await db.refresh(new_RT)

	return access_token_jwt



#функция проверки токена. Это используется при декодировании
async def access_token_decode(acces_token: str):#проверка аксес токена из куки  
    
    try:
        payload = jwt.decode(acces_token, KEY, algorithms=[ALG])#в acces_token передается просто строка
        
        user_id = payload.get("sub")#у меня тут user_id, а не юзернейм
        user_name = payload.get("user_name")
        is_active = payload.get("active")
        user_role = payload.get("role")

        if user_id is None:
            print("нет такого user_id")
            return [False, None, " ", None]
                
    except Exception as ex:
                
        if type(ex) == jwt.ExpiredSignatureError:#если время действия токена истекло, то вывод принта. Можно тут написать логику что будет если аксес токен истекает
            
            print("ОШИБКА АКСЕС ТУТ")
            print(ex)
            return [ex, None, " ", None]#если токен истек то это
    
        return [False, None, " ", None]#если токена нет вообще, то это возвращается
        
    return [is_active, user_id, user_name, user_role]


#функция для удобной проверки и обновления токенов. Не используется
async def test_token_expire(RT, db):
    tokens = await update_tokens(RT=RT, db=db)
    check = await access_token_decode(acces_token=tokens[1])
    return (tokens[0], tokens[1], check)#рефреш, аксес, дешифровка аксес






import smtplib
from email.message import EmailMessage
# from celery import Celery


#функция из джанго. Скорее всего нужно стандартную функцию юзать для почты smtplib. Возможно отправку почты сделать через селери, это как бы фоновая задача, отдельный процесс от фастапи, как бы второе приложение. И есть фловер, это еще один процесс.
# async def send_email_verify(data: dict|None=None, use_https=False):
# 	msg = MailBody(**data)
#     message = MIMEText(msg.body, "html")
#     message["From"] = USERNAME
#     message["To"] = ",".join(msg.to)
#     message["Subject"] = msg.subject

#     ctx = create_default_context()

#     try:
#         with SMTP(HOST, PORT) as server:
#             server.ehlo()
#             server.starttls(context=ctx)
#             server.ehlo()
#             server.login(USERNAME, PASSWORD)
#             server.send_message(message)
#             server.quit()
#         return {"status": 200, "errors": None}
#     except Exception as e:
#         return {"status": 500, "errors": e}

#тут переделал, идет переадрессация на фронт в ссылке из письма, а фронт уже обрабатывает функции с бэка. При восстановлении пароля логика та же
async def send_email_verify(user, use_https=False):
	email = EmailMessage()
	email['Subject'] = 'Подтверждение регистрации пользователя'
	email['From'] = HOST_USER
	email['To'] = user.email

	http = "http" if use_https == False else "https"	 

	token = jwt.encode({"sub": str(user.id)}, KEY3, algorithm=ALG)
	
	#параметры из ссылки пойдут при запуске функции activate_user
	email.set_content(f"<a href={http}://localhost:5173/regusers/registration_verify/{token}><h1>ССЫЛКА</h1></a>" , subtype='html')
    
	with smtplib.SMTP_SSL(HOST, PORT) as server:
		server.login(HOST_USER, HOST_PASSWORD)
		server.send_message(email)

    
# сделать токен одноразовым, пока не сделал
async def send_email_restore_password(user, use_https=False):
	email = EmailMessage()
	email['Subject'] = 'Восстановление пароля'
	email['From'] = HOST_USER
	email['To'] = user.email

	http = "http" if use_https == False else "https"	 

	token = jwt.encode({"sub": str(user.id)}, KEY4, algorithm=ALG)
	
	content = f"<a href={http}://localhost:5173/regusers/forgot_password_verify/{token}><h1>ССЫЛКА</h1></a>"
	email.set_content(content , subtype='html')
    
	with smtplib.SMTP_SSL(HOST, PORT) as server:
		server.login(HOST_USER, HOST_PASSWORD)
		server.send_message(email)

	return content



    
   


#########################
# email = EmailMessage()
#     email['Subject'] = 'Натрейдил Отчет Дашборд'
#     email['From'] = SMTP_USER
#     email['To'] = SMTP_USER

#     email.set_content(
#         '<div>'
#         f'<h1 style="color: red;">Здравствуйте, {username}, а вот и ваш отчет. Зацените 😊</h1>'
#         '<img src="https://static.vecteezy.com/system/resources/previews/008/295/031/original/custom-relationship'
#         '-management-dashboard-ui-design-template-suitable-designing-application-for-android-and-ios-clean-style-app'
#         '-mobile-free-vector.jpg" width="600">'
#         '</div>',
#         subtype='html'
#     )
#     return email


# @celery.task
# def send_email_report_dashboard(username: str):
#     email = get_email_template_dashboard(username)
#     with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
#         server.login(SMTP_USER, SMTP_PASSWORD)
#         server.send_message(email)





#понять где писать функцию отправки почты и что в нее передавать контекст html и тд
# background_tasks - фоновая задача, сам объект фоновой задачи принимает в себя функцию и параметры для нее. Выполняется в фоне