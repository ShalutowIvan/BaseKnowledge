from .secure import access_token_decode
from fastapi import HTTPException, Request
from settings import CLIENT_ID




async def verify_user_service(request: Request):
    client = request.headers.get("CLIENT_ID")
    if client != CLIENT_ID:        
        raise HTTPException(status_code=401, detail="Клиент ID не сходится!!!!!!!!!!!!!!")
        
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    check = await access_token_decode(acces_token=str(token))

    user_id = int(check[1])

    return user_id
