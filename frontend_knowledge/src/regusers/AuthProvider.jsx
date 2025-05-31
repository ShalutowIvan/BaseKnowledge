import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'
import { getRefreshToken, getAccessToken, updateAccessTokenFromRefreshToken } from "./AuthService"
import { API } from "../apiAxios/apiAxios"
import axios from "axios";



const AuthContext = createContext();


// export const AuthProvider = ({children}) => {
// 	const [user, setUser] = useState(null);
	
// 	const signin = (newUser, cb) => {
// 		setUser(newUser);
// 		cb();
// 	}
// 	const signout = (cb) => {
// 		setUser(null);
// 		cb();
// 	}

// 	const value = {user, signin, signout}


// 	return <AuthContext.Provider value={value}>
// 		{children}
// 	</AuthContext.Provider>

// }

const useAuth = () => {return useContext(AuthContext);}

const AuthProvider = ({children}) => {
	const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [tokenVersion, setTokenVersion] = useState(0); // Для принудительного обновления
  // const [isInitialized, setIsInitialized] = useState(false);
  // useEffect( () => {
  //   API.get("/api/detect_user/")

  // }, [] )


  //получается функция login берет имя пользака и передает его в состояние user
  const login = async (token) => {
    const decoded = jwtDecode(token);
      setUser({ fullName: decoded.user_name });
    };


  const logout = async () => {
    setUser(null)
  }


	//обновлние сделать
	useEffect( () => {
		
    const initializeAuth = async () => {

    const token = getAccessToken();
    // let newTokens = ""
    if (!token) {
      console.log("НЕТ ТОКЕНА")
      try {
        const newTokens = await updateAccessTokenFromRefreshToken();        
        const decoded = jwtDecode(newTokens["Authorization"]);
        setUser({ fullName: decoded.user_name });        
      } catch (error) {
          console.log("Ошибка при обновлении токена доступа: ", error)          
      } 
      // finally {
      //   setIsInitialized(true);
      // }
      
    } else {
      try {
        const decoded = jwtDecode(token);
        setUser({ fullName: decoded.user_name });        
      } catch (error) {
        Cookies.remove("RT");
        Cookies.remove("Authorization");
        console.log("All Cookie has been removed!");
      }
      // finally {
      //   setIsInitialized(true);
      // }
    }
    
    }
    initializeAuth()
  }, []);

  // if (!isInitialized) {
  //   return null; // или лоадер
  // }


	

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
    );
}



export { AuthProvider, useAuth }