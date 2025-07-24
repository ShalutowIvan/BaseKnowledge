from .secure import access_token_decode
from fastapi import HTTPException, Request
from settings import CLIENT_ID




async def verify_user_service(request: Request):
    client = request.headers.get("CLIENT_ID")    
    if client != CLIENT_ID:
        print("Не верный CLIENT_ID")
        return False
        # raise HTTPException(status_code=401, detail="Error CLIENT_ID")
        
    token = request.headers.get("Authorization")
    if not token:
        print("Не верный токен Authorization")
        return False
        # raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        check = await access_token_decode(acces_token=str(token))
        user_id = int(check[1])
        return user_id
    except Exception as ex:
        print("Ошибка при декодировании access_token ниже")
        print(ex)
        return False
        # raise HTTPException(status_code=401, detail="Not verified")


    
