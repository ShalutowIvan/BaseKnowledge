from dotenv import load_dotenv
from fastapi.templating import Jinja2Templates
import os


#папка с шаблонами html
templates = Jinja2Templates(directory="src/templates")

load_dotenv()
#креды для боевой БД
DB_HOST=os.environ.get("DB_HOST")
DB_PORT=os.environ.get("DB_PORT")
DB_NAME=os.environ.get("DB_NAME")
DB_USER=os.environ.get("DB_USER")
DB_PASS=os.environ.get("DB_PASS")

#для почты
PORT = os.environ.get("PORT")
HOST = os.environ.get("HOST")
HOST_USER = os.environ.get("HOST_USER")
HOST_PASSWORD = os.environ.get("HOST_PASSWORD")
DEFAULT_EMAIL = os.environ.get("DEFAULT_EMAIL")

#ключи для шифрования
KEY = os.environ.get("KEY")#для jwt access токена при авторизации
KEY2 = os.environ.get("KEY2")#для рефреш токена
KEY3 = os.environ.get("KEY3")#для токена активации
KEY4 = os.environ.get("KEY4")#для токена при сброе пароля
KEY5 = os.environ.get("KEY5")#для токена при генерации токена клиента

CLIENT_ID = os.environ.get("CLIENT_ID")#клиент ид, сгенерировал его сам

ALG = os.environ.get("ALGORITHM")

#время жизни токенов
EXPIRE_TIME = os.environ.get("ACCESS_TOKEN_EXPIRE_TIME")
EXPIRE_TIME_REFRESH = os.environ.get("REFRESH_TOKEN_EXPIRE_TIME")
EXPIRE_TIME_CLIENT_TOKEN = os.environ.get("CLIENT_TOKEN_EXPIRE_TIME")





