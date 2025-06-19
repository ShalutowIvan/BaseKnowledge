import { useState, useRef } from 'react'
import { Link, Outlet, NavLink, useNavigate, redirect } from 'react-router-dom'
import axios from "axios";
import Cookies from "js-cookie";
import { API } from "../apiAxios/apiAxios"
import { setAccessToken, setRefreshToken } from "./AuthService"
import { jwtDecode } from 'jwt-decode'

import { useAuth } from './AuthProvider'



export default function Authorization() {
    // поля формы
    // const [username, setUsername] = useState("");
    // //username - это почта
    // const [password, setPassword] = useState("");
    
    // для валидации
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
        
    // переделал под стандартную схему из фастапи OAuth2PasswordRequestForm
    const [formData, setFormData] = useState({
        username: '',
        password: ''
        });




    const { login } = useAuth();

    // const validateForm = () => {
    //     if (!username || !password) {
    //         setError("не введены логин или пароль");
    //         return false;
    //     }
    //     setError('');
    //     return true;
    // }

    // для схемы OAuth2PasswordRequestForm
    const validateForm = () => {
        if (!formData.username || !formData.password) {
            setError("не введены логин или пароль");
            return false;
        }
        setError('');
        return true;
    }

    const navigate = useNavigate();

    // const goHome = () => navigate("/");
	

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {        

            // Важно: используем FormData для совместимости с OAuth2PasswordRequestForm
            const data = new FormData();
            data.append('username', formData.username);
            data.append('password', formData.password);
            // ост тут...

            //вариант с моей схемой
            // const response = await axios.post("http://127.0.0.1:8000/api/regusers/auth",
            //     {                 
            //     username, 
            //     password,
            //     },
            //         { withCredentials: true }
            //     );

            //вариант с схемой OAuth2PasswordRequestForm
            const response = await axios.post("http://127.0.0.1:8000/api/regusers/auth", data, {
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    }
                    }
                    // { withCredentials: true }
                    );            


            setLoading(false);
            
            if (response.statusText==='OK') {
                console.log("Все хорошо")          
                setAccessToken(response.data["Authorization"])
                // Cookies.set("Authorization", response.data["Authorization"], {
                // expires: 0.0005, // Кука истечет через 30 дней, тут указывается колво дней
                // path: "/", // Кука будет доступна на всех страницах        
                // sameSite: "lax", // Защита от CSRF-атак
                // });                

                setRefreshToken(response.data["RT"])
                // Cookies.set("RT", response.data["RT"], {
                // expires: 30, // Кука истечет через 30 дней, тут указывается колво дней
                // path: "/", // Кука будет доступна на всех страницах        
                // sameSite: "lax", // Защита от CSRF-атак
                // });
                
                // setName(response.data["Authorization"].user_name)
                // goHome()
                // const decoded = jwtDecode(response.data["Authorization"]);

                login(response.data["Authorization"]);

                // navigate("/", { state: { fullName: decoded.user_name } });
                
                navigate("/");
            } 
            // else {
            //     const errorData = await response.data
            //     console.log(errorData, 'тут ошибка после ввода кредов')
            //     setError(errorData.detail || 'аутентификация не прошла');
            // }
        
        // const token = Cookies.get("theme");
        // console.log(document.cookie)

        // const cookies2 = response.headers;
        // console.log(token);
        // if (response.status === 200) {
        // console.log("Login successful!");
        // navigate("/profile"); // Перенаправление на страницу профиля
        // }

        } catch (error) {
            setLoading(false);
            console.log(error)
            setError('аутентификация не прошла, попробуйте еще раз');            
        }
   

    };


    // для схемы OAuth2PasswordRequestForm
    const handleChange = (e) => {
        setFormData({
          ...formData,
          [e.target.name]: e.target.value
        });
      };



	return (
		<>
		<h1 style={{ textAlign: 'center' }}>Вход</h1>
        <div className='registration-section'>
        
            <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>                    

                    <label htmlFor="id_username" className='label-style'>Электронная почта: </label>
                    <br/>
                    <input 
                        placeholder="e-mail"
                        name="username"                    
                        type="email"
                        id="id_username"
                        className="input-text"
                        // value={username}
                        value={formData.username}
                        // onChange={(e) => setUsername(e.target.value)}   
                        onChange={handleChange}
                    />

                    <br/><br/>

                    <label htmlFor="id_password" className='label-style'>Пароль: </label>
                    <br/>
                    <input 
                        placeholder="Введите пароль"
                        name="password"
                        type="password"
                        id="id_password"
                        className="input-text"
                        // value={password}
                        value={formData.password}
                        // onChange={(e) => setPassword(e.target.value)}      
                        onChange={handleChange}
                    />

                    <br/><br/>

                    <button type="submit" disabled={loading} className="save-button">
                        {loading ? 'Входим в...' : 'Вход'}
                    </button>
                    <br/>

                    {/*если ошибка error отображаем ее в параграфе ниже*/}
                    

            </form>

            {error && <p style={{ color: 'red'}}>{error}</p>}

            <h3><NavLink to="/regusers/registration/">Регистрация</NavLink></h3>

            <h3><NavLink to="/regusers/forgot_password/">Забыли пароль</NavLink></h3>

        </div>
           
        
		</>
		)



}



// axios запрос возвращает объект