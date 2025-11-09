import axios from "axios";
import { updateAccessTokenFromRefreshToken, setAccessToken, getAccessToken, setRefreshToken } from "../../../regusers/AuthService"

import { apiKey } from "../../../config/config"

import { getRoleToken } from "./RoleService"



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
        
    if (roleToken) {
      // console.log(config)
      // config.headers.Authorization = accessToken;
      config.headers.CLIENT_ID = apiKey;
      config.headers["Project_token"] = roleToken;
    }

    delete config.params.project_id;

    return config;
  },
  
  (error) => {
    return Promise.reject(error);
  }
);



axiosRole.interceptors.response.use(
  (response) => response, // Успешные ответы пропускаем как есть
  (error) => {
    // Обрабатываем только ошибки с ответом от сервера
    if (error.response) {
      const { status, data } = error.response;

      // Глобальные сценарии (например, для 401)
      // if (status === 401) {
      //   window.location.href = '/login'; // Перенаправление на логин
      // }

      // Пробрасываем ошибку дальше в компонент
      // return Promise.reject({
      //   message: data.detail?.message,
      //   error_code: data.detail?.error_code,
      //   status,
      //   errorDetail: data.detail
      // });
      return Promise.reject(error)
    }
    // прокинул ошибку в консоль, кажется не читается куери параметр.... ост тут
    console.log("ошибки интерцептора роли тут:", error)
    // Для ошибок сети/таймаута
    // return Promise.reject({
    //   message: 'Сервер не отвечает. Проверьте интернет.',
    //   status: null,
    // });
    return Promise.reject(error)
  }
);



export { axiosRole };






