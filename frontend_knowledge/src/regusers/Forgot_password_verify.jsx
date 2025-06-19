import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from "axios";






export default function Forgot_password_verify() {
	const {token} = useParams();
	
	const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");

    const [res, setRes] = useState("")//сообщение о дальнейшем действии

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const goBack = () => {
      return navigate("/regusers/authorization/");}

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

    const validateForm = () => {
        if (!password1 || !password2) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

    const forgot_pass = async (e) => {
        if (!validateForm()) return;
        e.preventDefault();
        try {
            setLoading(true);    
            const response = await axios.post(`http://127.0.0.1:8000/api/regusers/restore/password_user/${token}`, {                 
                password1, 
                password2, });
        console.log("Password changed successful:", response.data);
        setRes("Пароль успешно изменен, можете перейти на страницу входа.")
        setLoading(false);
        } catch (error) {
        console.error("Password changed failed:", error.response.data);
        
        } finally {
            setLoading(false);
        }
    };




	return (
		<>
		<h1 style={{ textAlign: 'center' }}>Придумайте новый пароль</h1>        

		<div className='registration-section'>
    		<form onSubmit={forgot_pass} style={{ marginBottom: '1rem' }}>
                    

                    <label htmlFor="id_password1" className="label-style">Пароль: </label>
                    <br/>
                    <input 
                    	placeholder="Придумайте пароль"
                    	name="password1"
                        type="password"
                        id="id_password1"
                        className="input-text"                     
                        value={password1}
                        onChange={(e) => setPassword1(e.target.value)}      
                    />

                    <br/><br/>

                    <label htmlFor="id_password2" className="label-style">Повторите пароль: </label>
                    <br/>
                    <input 
                    	placeholder="Повторите пароль"
                    	name="password2"
                        type="password"
                        id="id_password2"
                        className="input-text"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}                
                                
                    />

                    <br/><br/>
                    
                    <button type="submit" className="save-button" disabled={loading}>
                        {loading ? 'Загрузка...' : 'Подтвердить'}
                    </button>
                    <br/><br/><br/>

                    <button onClick={goBack} className="toolbar-button">На страницу входа</button>
            </form>

            <h2>{res}</h2>
            
            {error && <p style={{ color: 'red'}}>{error}</p>}
            

        </div>
	

		</>
		)

}

// у меня пока что проверка на пустое поле работает только на поле имени name остальные поля не валидируются. Пока так оставил.


