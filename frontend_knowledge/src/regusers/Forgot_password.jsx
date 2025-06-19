import { useState, useRef } from 'react'
import axios from "axios";
import { useNavigate } from 'react-router-dom'







export default function Forgot_password() {	
    // состояние поля формы
    const [email, setEmail] = useState("");
    
    const [res, setRes] = useState("")//сообщение о переходе в почту для восстановления пароля

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
	

    const navigate = useNavigate();

    const goBack = () => {
      return navigate("/regusers/authorization/");}

    const validateForm = () => {
        if (!email) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }


    const sendEmailFromForgotPass = async (e) => {
        if (!validateForm()) return;
        e.preventDefault();
        try {
            setLoading(true);      
            const response = await axios.post("http://127.0.0.1:8000/api/regusers/forgot_password", {                 
                email, 
                });
        console.log("Sending successful:", response.data);
        setRes("Перейдите по ссылке из письма для восстановления пароля.")
        setLoading(false);
        } catch (error) {

        console.error("Sending failed:", error.response.data);
        } finally {
            setLoading(false);
        }
    };





	return (
		<>
        <h1 style={{ textAlign: 'center' }}>Восстановление пароля</h1>
        <div className='registration-section'>
    		<h1>Введите почту для восстановления пароля</h1>

    		<form onSubmit={sendEmailFromForgotPass} style={{ marginBottom: '1rem' }}>
                    

                    <label htmlFor="id_email" className="label-style">Электронная почта: </label>
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
                    

                    <button type="submit" className="save-button" disabled={loading}>
                        {loading ? 'Загрузка...' : 'Восстановить пароль'}                        
                    </button>
                    <br/>
                    <h2>{res}</h2>
                    <br/><br/>

                <button onClick={goBack} className="toolbar-button">Назад</button>

                </form>
            
            {error && <p style={{ color: 'red'}}>{error}</p>}
            
        </div>



		</>
		)



}




