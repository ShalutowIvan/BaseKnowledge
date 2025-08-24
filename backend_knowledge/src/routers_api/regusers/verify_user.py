from .secure import access_token_decode
from fastapi import HTTPException, Request, Depends, Header, status
from settings import CLIENT_ID
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials




# это моя ручная проверка, без подвязки сваггера 
# async def verify_user_service(request: Request):
#     client = request.headers.get("CLIENT_ID")    
#     if client != CLIENT_ID:
#         print("Не верный CLIENT_ID")
#         return False
#         # raise HTTPException(status_code=401, detail="Error CLIENT_ID")
        
#     token = request.headers.get("Authorization")
#     if not token:
#         print("Не верный токен Authorization")
#         return False
#         # raise HTTPException(status_code=401, detail="Not authenticated")
    
#     try:
#         check = await access_token_decode(acces_token=str(token))
#         user_id = int(check[1])
#         return user_id
#     except Exception as ex:
#         print("Ошибка при декодировании access_token ниже")
#         print(ex)
#         return False
#         # raise HTTPException(status_code=401, detail="Not verified")




# оставил алиасы, сделать дальше...

# Зависимость для проверки JWT и извлечения user_id
# async def get_current_user(
#     token: str = Depends(HTTPBearer(auto_error=False))
# ) -> int:
#     if not token:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Missing Authorization header"
#         )
    
#     try:
#         check = await access_token_decode(acces_token=token.credentials)
#         return int(check[1])
#     except Exception as ex:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired token"
#         )

security = HTTPBearer()


async def custom_token_check(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header"
        )

    try:
        check = await access_token_decode(acces_token=str(token))
        return int(check[1])
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# Зависимость для проверки CLIENT_ID
async def verify_client_id(client_id: str = Header(..., alias="CLIENT_ID")) -> bool:
    if client_id != CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid CLIENT_ID"
        )
    return True


# Объединенная зависимость 
async def verify_user_service(
    client_id: str = Depends(verify_client_id),
    user_id: int = Depends(custom_token_check)
    ) -> int:
    return user_id

    
