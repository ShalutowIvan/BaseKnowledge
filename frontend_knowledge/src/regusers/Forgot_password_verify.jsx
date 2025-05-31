import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from "axios";






export default function Forgot_password_verify() {
	const {token} = useParams();
	
	const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");

// http://127.0.0.1:8000/api/regusers/verification/check_user/
// ост тут, делаю переход по ссылке с бэка в юзэффекте, а на почту будет отправляться роут с фронта
	

	// try {
	// useEffect(() => {
	// 	fetch(`http://127.0.0.1:8000/api/regusers/verification/check_user/${token}`)

	// }, [])
	// console.log("Успешно");
	// setRes("Успешно")
    // } catch (error) {
    //   console.error("Плохо");
    //   setRes("Все плохо")
    // }

    // async function forgot_pass() {
    // 	try {
    // 		await fetch(`http://127.0.0.1:8000/api/regusers/restore/password_user/${token}`)
    // 		console.log("Успешно");
    // 		setRes("Успешно")
    // 		} catch (error) {
    //   		console.error("Плохо");
    //   		setRes("Все плохо")
    // 		}
    // }

    const forgot_pass = async (e) => {
        e.preventDefault();
        try {            
            const response = await axios.post(`http://127.0.0.1:8000/api/regusers/restore/password_user/${token}`, {                 
                password1, 
                password2, });
        console.log("Password changed successful:", response.data);

        } catch (error) {
        console.error("Password changed failed:", error.response.data);
        
        }
    };




	return (
		<>
		<h1>Придумайте новый пароль</h1>

		
		<form onSubmit={forgot_pass} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_password1">Пароль: </label>
                <input 
                	placeholder="Придумайте пароль"
                	name="password1"
                    type="password"
                    id="id_password1"
                    className="control"                     
                    value={password1}
                    onChange={(e) => setPassword1(e.target.value)}      
                />

                <br/>

                <label htmlFor="id_password2">Повторите пароль: </label>
                <input 
                	placeholder="Повторите пароль"
                	name="password2"
                    type="password"
                    id="id_password2"
                    className="control"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}                
                            
                />

                <br/><br/>
                

                <button type="submit">
                    Подтвердить
                </button>

            </form>


	

		</>
		)

}

// у меня пока что проверка на пустое поле работает только на поле имени name остальные поля не валидируются. Пока так оставил.


