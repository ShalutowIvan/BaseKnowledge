from fastapi import HTTPException, Request
# from settings import CLIENT_ID
from settings import PROJECT_KEY, EXPIRE_TIME_PROJECT_TOKEN, ALG
import jwt # это PyJWT


async def role_token_decode(role_token: str):#проверка аксес токена из куки  
    
    try:
        payload = jwt.decode(role_token, PROJECT_KEY, algorithms=[ALG])#в acces_token передается просто строка
        # пример как формировали data
        # data = {"project_id": user_project.project_id , "user_id": user_project.user_id, "role": user_project.role.value}
        project_id = payload.get("project_id")        
        user_id = payload.get("user_id")
        role = payload.get("role")        
        
        if user_id is None:
            print("нет такого user_id")
            return [None, None, " "]
                
    except Exception as ex:
                
        if type(ex) == jwt.ExpiredSignatureError:#если время действия токена истекло, то вывод принта. Можно тут написать логику что будет если аксес токен истекает
            
            print("ОШИБКА ТОКЕНА РОЛИ ТУТ")
            print(ex)
            return [ex, None, " "]#если токен истек то это
    
        return [None, None, " "]#если токена нет вообще, то это возвращается
        
    return [project_id, user_id, role]



async def verify_role_service(request: Request):
    # client = request.headers.get("CLIENT_ID")
    # if client != CLIENT_ID:        
    #     raise HTTPException(status_code=401, detail="Клиент ID не сходится!!!!!!!!!!!!!!")
        
    role_token = request.headers.get("Project_Token")
    if not role_token:
        raise HTTPException(status_code=401, detail="Not role_token")
    print("Тут роль токен!!!!!!!!!!!")
    print(role_token)#тут object Promise, а не токен!!!!
    
    check = await role_token_decode(role_token=str(role_token))

    # user_id = int(check[1])

    return check



# ост тут. Делаю дешифровку токена роли и дальнейшее его использование