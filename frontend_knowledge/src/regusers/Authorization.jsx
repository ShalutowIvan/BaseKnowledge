import { useState, useRef } from 'react'
import { Link, Outlet, NavLink, useNavigate, redirect } from 'react-router-dom'
import axios from "axios";
import Cookies from "js-cookie";
import { API } from "../apiAxios/apiAxios"
import { setAccessToken, setRefreshToken } from "./AuthService"
import { jwtDecode } from 'jwt-decode'

import { useAuth } from './AuthProvider'



export default function Authorization() {
    // const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    //username - это почта
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // const [name, setName] = useState("")
    // const history = useHistory();

    const { login } = useAuth();

    const validateForm = () => {
        if (!username || !password) {
            setError("не введены логин или пароль");
            return false;
        }
        setError('');
        return true;
    }

    const navigate = useNavigate();

    // const goHome = () => navigate("/");
	

    // const [form, setForm] = useState({        
    //     email: "",
    //     password: "",        
    //     hasError: false,
    // })


    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {            
            const response = await axios.post(
                "http://127.0.0.1:8000/api/regusers/auth",
                {                 
                username, 
                password,
                },
                    { withCredentials: true }
                );
            setLoading(false);
            
            if (response.statusText==='OK') {                
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

            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка после ввода кредов')
                // setError(errorData.detail || 'аутентификация не прошла');
            }
    
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

    
    // return redirect('/')

    };

    // function TestCookie() {
    //     const token = Cookies.get("Authorization");
    //     console.log(token);
    // }

	return (
		<>
		<h1>Вход</h1>

		<form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_username">Электронная почта: </label>
                <input 
                    placeholder="e-mail"
                    name="username"                    
                    type="email"
                    id="id_username"
                    className="control"                        
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}   
                />

                <br/><br/>

                <label htmlFor="id_password">Пароль: </label>
                <input 
                    placeholder="Введите пароль"
                    name="password"
                    type="password"
                    id="id_password"
                    className="control"                     
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}      
                />

                

                <br/><br/>

                <button type="submit" disabled={loading}>                    
                    {loading ? 'Входим в...' : 'Вход'}
                </button>
                <br/>

                {/*если ошибка error отображаем ее в параграфе ниже*/}
                {error && <p style={{ color: 'red'}}>{error}</p>}

            </form>

            <h2><NavLink to="/regusers/registration/">Регистрация</NavLink></h2>

            <h2><NavLink to="/regusers/forgot_password/">Забыли пароль</NavLink></h2>


            <h1>{username}</h1>
            <h1>{password}</h1>

            {/*<button onClick={TestCookie}>Тест куки</button>*/}

		</>
		)



}



// axios запрос возвращает объект