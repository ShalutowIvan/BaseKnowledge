import axios from "axios";
import Cookies from "js-cookie";


// тут просто набор функций для обновления токенов

// const login = async (username, password) => {
//   const response = await axios.post(`${API_URL}/token`, {
//     username,
//     password,
//   });
//   if (response.data.access_token) {
//     localStorage.setItem("access_token", response.data.access_token);
//     Cookies.set("refresh_token", response.data.refresh_token, { secure: true, sameSite: "strict" });
//   }
//   return response.data;
// };

const setAccessToken = (token) => { 
  Cookies.set("Authorization", token, {
    expires: 0.0005, // Кука истечет через 30 дней, тут указывается колво дней
    path: "/", // Кука будет доступна на всех страницах        
    sameSite: "lax", // Защита от CSRF-атак
    });
  // localStorage.setItem("Authorization", token);
};


const getAccessToken = () => { 
  // return localStorage.getItem("Authorization"); 
  return Cookies.get("Authorization")
};



const setRefreshToken = (token) => {
  Cookies.set("RT", token, {
                expires: 30, // Кука истечет через 30 дней, тут указывается колво дней
                path: "/", // Кука будет доступна на всех страницах        
                sameSite: "lax", // Защита от CSRF-атак
                });
};


const getRefreshToken = () => {
    return Cookies.get("RT")
};







const updateAccessTokenFromRefreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token found");
  }
  //делаю запрос на обновление токенов
  const response = await axios.get(`http://127.0.0.1:8000/api/regusers/auth/update_access_token/${refreshToken}`);

  //закидываю токены в куки
  setAccessToken(response.data["Authorization"]);
  setRefreshToken(response.data["refresh_token"])  

  // const response = await axios.post(`${API_URL}/refresh-token`, {
  //   refresh_token: refreshToken,
  // });
  // if (response.data["Authorization"]) {
  //     setRefreshToken(response.data["Authorization"])
  // }
  
  return response.data;
};

// const getAccessToken = () => {
//   return localStorage.getItem("access_token");
// };

export { updateAccessTokenFromRefreshToken, setAccessToken, setRefreshToken, getAccessToken, getRefreshToken };