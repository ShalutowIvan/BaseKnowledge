import axios from "axios";
import { updateAccessTokenFromRefreshToken, setAccessToken, getAccessToken, setRefreshToken } from "../regusers/AuthService"

import { apiKey } from "../config/config"


//API_URL -это стартовая ссылка из сервера БЭКА для апи. Потом когда будем делать запросы, можно будет дописывать путь к БЭКУ, в виде строки когда будем делать запросы через экземпляр API
const API_URL = "http://127.0.0.1:8000";

// Создаем экземпляр axios
const API = axios.create({
  baseURL: API_URL,
   // Для работы с куками
});


// что то тут с асинхронностью....

// Интерцептор для добавления access токена в заголовки запросов
API.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      // config.headers.Authorization = `Bearer ${accessToken}`;
      // console.log(config)
      config.headers.CLIENT_ID = apiKey;
      config.headers.Authorization = accessToken;
      
    }
    return config;
  },
  (error) => {
    console.log("Ошибка интерцептора в request:", error)
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок и обновления токена
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка связана с истекшим access токеном
    // if (error.response.status === 403 && !originalRequest._retry) 

    // const verifyAccess = axios.get(`http://127.0.0.1:8000/api/regusers/auth/verify_access_token/${getAccessToken()}`)
    const verifyAccess = true

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Помечаем запрос как повторный

      // ост тут, не обновляется. Сделать проверку токена через роут бэка. Если будет тру то делать обнову.!!!!!!!!!!!!!!!!

      try {
        // Пробуем обновить access токен с помощью refresh токена
        const newTokens = await updateAccessTokenFromRefreshToken();
        if (newTokens["Authorization"]) {
          // Обновляем access токен в куке
          // setAccessToken(newTokens["Authorization"]);
          // setRefreshToken(newTokens["refresh_token"])       
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = newTokens["Authorization"];
          originalRequest.headers.CLIENT_ID = apiKey;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Если refresh токен тоже истек, перенаправляем на страницу входа
        // window.location.href = "/regusers/authorization";
        // return <Navigate to='/regusers/authorization/' />
        
      }
    }

    return Promise.reject(error);
  }
);

export { API };






