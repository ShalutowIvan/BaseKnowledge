from fastapi import HTTPException, Request, status, Path, Header, Depends
from settings import CLIENT_ID
from settings import PROJECT_KEY, EXPIRE_TIME_PROJECT_TOKEN, ALG
import jwt # это PyJWT
from typing import Annotated



async def parse_role_service(request):
    pass

# ост на тесте роли



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
            return (None, None, " ")
                
    except Exception as ex:
                
        if type(ex) == jwt.ExpiredSignatureError:#если время действия токена истекло, то вывод принта. Можно тут написать логику что будет если аксес токен истекает
            
            print("ОШИБКА ТОКЕНА РОЛИ ТУТ")
            print(ex)
            return (ex, None, " ")#если токен истек то это
    
        return (None, None, " ")#если токена нет вообще, то это возвращается
        
    return (project_id, user_id, role)



async def verify_client_id(client_id: str = Header(..., alias="CLIENT_ID")) -> bool:
    if client_id != CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid CLIENT_ID"
        )
    return True



# парсим роль из токена роли
async def verify_role_token(
    project_id: Annotated[int, Path(...)],
    project_token: Annotated[str, Header(..., alias="Project_token")]
    ):

    check = await role_token_decode(role_token=str(project_token))

    if check[0] != project_id:
        print("Вы пользователь другого проекта!")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "access_denied", "message": "User is not a member of this project"})    

    return check


# проверка принадлежности проекту и соответствие роли админа. есть 2 параметра. Роль равна или роль не равна. Передаем обычно один параметр, а второй None. И тогда второе условие не срабатывает
# async def verify_project_service(role, project_id: int):

#     if role[0] != project_id:
#         print("Вы пользователь другого проекта!")
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "access_denied", "message": "User is not a member of this project"})    

#     return True


async def verify_project_service(
    client_id: str = Depends(verify_client_id),
    role_info: tuple[int, int, str] = Depends(verify_role_token)
    ) -> int:
    return role_info

