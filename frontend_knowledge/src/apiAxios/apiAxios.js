import axios from "axios";
import { updateAccessTokenFromRefreshToken, setAccessToken, getAccessToken, setRefreshToken } from "../regusers/AuthService"

import { apiKey } from "../config/config"

// гет и сет для глобального состояния обновления токенов
import { getRefreshState, setRefreshState } from './tokenRefreshState';


//API_URL -это стартовая ссылка из сервера БЭКА для апи. Потом когда будем делать запросы, можно будет дописывать путь к БЭКУ, в виде строки когда будем делать запросы через экземпляр API
const API_URL = "http://127.0.0.1:8000";

// Создаем экземпляр axios
const API = axios.create({
  baseURL: API_URL,
   // Для работы с куками
});


// Интерцептор для добавления access токена в заголовки запросов
API.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      // console.log(config)
      config.headers.CLIENT_ID = apiKey;
      // config.headers.Authorization = accessToken;

      
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

    if (error.response?.status >= 400 && error.response?.status <= 499 && !originalRequest._retry) {
    
      originalRequest._retry = true; // Помечаем запрос как повторный

      // Получаем текущее состояние обновления
      const { isRefreshing, refreshPromise: existingPromise } = getRefreshState();

      // Если обновление уже идет, присоединяемся к существующему промису
      if (isRefreshing) {
        try {
          // Ждем завершения текущего обновления
          await existingPromise;
          // Обновляем заголовок запроса новым токеном
          originalRequest.headers.Authorization = getAccessToken();
          // Повторяем оригинальный запрос
          return API(originalRequest);
        } catch (e) {
          // Если обновление не удалось, возвращаем ошибку
          return Promise.reject(error);
        }
      }

      // Если обновление не идет - инициируем новое
      // setRefreshState(true);//это лишнее, и так сет состояния есть
      // Создаем промис для обновления токена, но пока не выполняем его, а только создаем
      const newRefreshPromise = updateAccessTokenFromRefreshToken()
        // .then((newTokens) => {
        //   // При успешном обновлении сохраняем новый токен
        //   if (newTokens["Authorization"]) {
        //     setAccessToken(newTokens["Authorization"]);
        //   }
        //   return newTokens;
        // })
        .finally(() => {
          // В любом случае (успех/ошибка) сбрасываем состояние
          setRefreshState(false, null);
        });
        //решил пока убрать сет аксес токена, так как updateAccessTokenFromRefreshToken и так делает сет токенов
      
      // Атомарно устанавливаем новое состояние (перед await!). После установки промис все еще не выполняется
      setRefreshState(true, newRefreshPromise);


      try {
          // Ждем завершения обновления токена
          const newTokens = await newRefreshPromise;
          // Обновляем заголовок оригинального запроса
          originalRequest.headers.Authorization = getAccessToken();
          // Повторяем оригинальный запрос с новым токеном
          return API(originalRequest);
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          // Возвращаем исходную ошибку
          return Promise.reject(error);
        }
      }
      

      // ниже старый код, до модификации с ожиданием обновления токена
      // try {
      //   // Пробуем обновить access токен с помощью refresh токена
      //   const newTokens = await updateAccessTokenFromRefreshToken();
      //   if (newTokens["Authorization"]) {
      //     // Обновляем access токен в куке
      //     // setAccessToken(newTokens["Authorization"]);
      //     // setRefreshToken(newTokens["refresh_token"])       
      //     // Повторяем оригинальный запрос с новым токеном
          
      //     // первый вариант указания заголовков
      //     originalRequest.headers.Authorization = newTokens["Authorization"];
      //     originalRequest.headers.CLIENT_ID = apiKey;

      //     // второй вариант указания заголовков
      //     // API.defaults.headers.common['Authorization'] = newTokens["Authorization"];
      //     // API.defaults.headers.common['CLIENT_ID'] = apiKey;

      //     return API(originalRequest);
      //   }
      // } catch (refreshError) {
      //   console.error("Failed to refresh token:", refreshError);
      //   // Если refresh токен тоже истек, перенаправляем на страницу входа
      //   // window.location.href = "/regusers/authorization";
      //   // return <Navigate to='/regusers/authorization/' />
        
      // }
    // } // это закрывающая скобка условия проверки кодов ошибок которые проверяем вначале кода

    return Promise.reject(error);
  }
);

export { API };






