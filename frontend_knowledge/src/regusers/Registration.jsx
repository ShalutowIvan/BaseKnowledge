import { useState, useRef } from 'react'
import axios from "axios";
import { useNavigate } from 'react-router-dom'




export default function Registration() {
    // состояния для формы
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");

    //состояния ошибки и загрузки
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    
    
    const navigate = useNavigate();

    const goBack = () => {
      return navigate("/regusers/authorization/");}

    const validateForm = () => {
        if (!name || !email || !password1 || !password2) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {            
            const response = await axios.post("http://127.0.0.1:8000/api/regusers/registration", { 
                name, 
                email, 
                password1, 
                password2, });
        console.log("Registration successful:", response.data);
        setLoading(false);

        if (response.statusText==='OK') {            
                console.log('Registration successful')
                //здесь должна переадресация на страницу с описанием дальнейших действий, а не просто уведомление или переход на стартовую страницу... ост тут
                navigate("/regusers/registration/check_mail/", { state: { message: email } })
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }


        } catch (error) {
        console.error("Registration failed:", error.response.data);
        } finally {
            setLoading(false);
        }
    };



	return (
		<>
        <h1 style={{ textAlign: 'center' }}>Регистрация</h1>
        <div className='registration-section'>
		
        
		<form onSubmit={handleRegister} style={{ marginBottom: '1rem'}}>
                <label htmlFor="id_name" className='label-style'>Ваше имя: </label>
                <br/>
                <input 
                	placeholder="введите ФИО"
                	name="name"
                    type="text"
                    id="id_name"
                    className="input-text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                        
                    
                />

                <br/><br/>

                <label htmlFor="id_email" className='label-style'>Электронная почта: </label>
                <br/>
                <input 
                	placeholder="e-mail"
                	name="email"                	
                    type="email"
                    id="id_email"
                    className="input-text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}   
                />

                <br/><br/>

                <label htmlFor="id_password1" className='label-style'>Пароль: </label>
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

                <label htmlFor="id_password2" className='label-style'>Повторите пароль: </label>
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

                <button className="save-button" type="submit" disabled={loading}>
                    {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                </button>
                <br/><br/><br/>
                <button onClick={goBack} className="toolbar-button">Назад</button>
                
                <br/>
                
                    
            </form>
        {error && <p style={{ color: 'red'}}>{error}</p>}
         </div>

		</>
		)

}








