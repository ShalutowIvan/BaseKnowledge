import axios from "axios";
import Cookies from "js-cookie";
import { API } from "../../../apiAxios/apiAxios"
import { jwtDecode } from 'jwt-decode';


function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token); // Декодируем токен без проверки подписи
    const currentTime = Date.now() / 1000; // Текущее время в секундах
    return decoded.exp < currentTime; // true если токен просрочен
  } catch (error) {
    console.error('Invalid token', error);
    return true; // Токен битый — считаем просроченным
  }
}


async function getRoleToken({project_id}) {
  const roleToken = Cookies.get('Project_Token');
  
  // Проверяем валидность токена (например, через декодирование JWT)
  if (roleToken && !isTokenExpired(roleToken)) {
    return roleToken; // Токен валиден
  }

  // Если токена нет или он истёк, запрашиваем новый
  try {
    const response = await API.post(`/create_project_token/`,
            {
              project_id: project_id
            }
          );

    roleToken = response.data["Project_Token"];
    Cookies.set('Project_Token', roleToken);
    return roleToken;
  } catch (error) {
    console.error('Failed to refresh role token', error);
    throw error; // Пробрасываем ошибку, чтобы обработать её в интерцепторе
  }
}






export { getRoleToken };







