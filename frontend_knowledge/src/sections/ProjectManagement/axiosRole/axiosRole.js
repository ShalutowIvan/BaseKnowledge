import axios from "axios";
import { updateAccessTokenFromRefreshToken, setAccessToken, getAccessToken, setRefreshToken } from "../../../regusers/AuthService"

import { apiKey } from "../../../config/config"

import { getRoleToken } from "./RoleService"

// все проверить и дописать логику обновления и получению roleToken. Ост тут !!!!!!!!!!!!!!!!!!!!!!!!!!!


//API_URL -это стартовая ссылка из сервера БЭКА для апи. Потом когда будем делать запросы, можно будет дописывать путь к БЭКУ, в виде строки когда будем делать запросы через экземпляр API
const API_URL = "http://127.0.0.1:8000";

// Создаем экземпляр axios
const axiosRole = axios.create({
  baseURL: API_URL,
   // Для работы с куками
});

axiosRole.interceptors.request.use(
  async (config) => {
    const projectId = config.params?.project_id;

    const roleToken = await getRoleToken(projectId);//если истек роль токен, то делаем его обновление используя API. Не читается тут project_id
    

    // const accessToken = getAccessToken();
    
    if (roleToken) {
      // console.log(config)
      // config.headers.Authorization = accessToken;
      config.headers.CLIENT_ID = apiKey;
      config.headers["Project_Token"] = roleToken;
    }

    delete config.params.project_id;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок и обновления токена
// axiosRole.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Если ошибка связана с истекшим access токеном
//     // if (error.response.status === 403 && !originalRequest._retry) 

//     // const verifyAccess = axios.get(`http://127.0.0.1:8000/api/regusers/auth/verify_access_token/${getAccessToken()}`)
//     // const verifyAccess = true

//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true; // Помечаем запрос как повторный

//       // ост тут, не обновляется. Сделать проверку токена через роут бэка. Если будет тру то делать обнову.!!!!!!!!!!!!!!!!

//       try {
//         // Пробуем обновить access токен с помощью refresh токена
//         const newAccess = await updateAccessTokenFromRefreshToken();
//         const newRole = await updateRoleTokenFromAccessToken();
//         if (newAccess["Authorization"] && newRole["X-User-Role-Token"]) {
//           // Обновляем access токен в куке
//           // setAccessToken(newTokens["Authorization"]);
//           // setRefreshToken(newTokens["refresh_token"])       
//           // Повторяем оригинальный запрос с новым токеном
//           originalRequest.headers.Authorization = newAccess["Authorization"];
//           originalRequest.headers["X-User-Role-Token"] = newRole["X-User-Role-Token"];
//           return axiosRole(originalRequest);
//         }
//       } catch (refreshError) {
//         console.error("Failed to refresh token:", refreshError);
//         // Если refresh токен тоже истек, перенаправляем на страницу входа
//         // window.location.href = "/regusers/authorization";
//         // return <Navigate to='/regusers/authorization/' />
        
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export { axiosRole };






