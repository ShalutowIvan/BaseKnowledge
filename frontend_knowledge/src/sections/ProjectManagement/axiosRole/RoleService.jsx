import axios from "axios";
import Cookies from "js-cookie";
import { API } from "../../../apiAxios/apiAxios"
import { jwtDecode } from 'jwt-decode';



const ROLES_USERS = {
      ADMIN: 'admin',
      EDITOR: 'editor',
      VIEWER: 'viewer',
      GUEST: 'guest'
    };




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


async function getRoleToken(project_id) {
  const roleToken = Cookies.get('Project_token');
  
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

    
    const newRoleToken = response.data["project_token"];    
    Cookies.set("Project_token", newRoleToken, {
              // expires: 0.0005, // тут указывается колво дней тут 0,72 минуты
              expires: 30, // Кука истечет через 30 дней, тут указывается колво дней
              path: "/", // Кука будет доступна на всех страницах        
              sameSite: "lax", // Защита от CSRF-атак
              });

    return newRoleToken;
  } catch (error) {
    // console.error('Ошибка при получении токена роли', error.response.status);
    console.error('Ошибка при получении токена роли', error.response.data.detail.message);
    
    return error.response.data.detail.error_code;
  }
}


//тут идет сравнение номера проекта в токене и в параметр ссылки, это если юзэффект
// async function roleTokenVerify(project_id) {  

//   const roleToken = Cookies.get('Project_token');

//   const decoded = jwtDecode(roleToken); 
  
//   if (decoded.project_id !== project_id) {    
//     return true
//   } else if ((decoded.project_id === project_id)) {
//     return false
//   }

// }

// это для лоадера
// async function roleTokenVerify(project_id) {  

//   const roleToken = getRoleToken(project_id) 

//   const decoded = jwtDecode(roleToken); 
  
//   if (decoded.project_id !== project_id) {    
//     return true
//   } else if ((decoded.project_id === project_id)) {
//     return false
//   }

// }





export { getRoleToken, ROLES_USERS };







