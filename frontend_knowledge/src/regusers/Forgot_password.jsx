import { useState, useRef } from 'react'
import axios from "axios";








export default function Forgot_password() {
	// const [form, setForm] = useState({        
    //     email: "",        
    //     hasError: false,
    // })
    const [email, setEmail] = useState("");

	// function handleNameChange(event) {
        
    //     setForm((prev) => ({
    //         ...prev,
    //         email: event.target.value,
    //         hasError: event.target.value.trim().length === 0,
    //     })

    //         )
    // }



    const sendEmailFromForgotPass = async (e) => {
        e.preventDefault();
        try {            
            const response = await axios.post("http://127.0.0.1:8000/api/regusers/forgot_password", {                 
                email, 
                });
        console.log("Sending successful:", response.data);
        } catch (error) {
        console.error("Sending failed:", error.response.data);
        }
    };





	return (
		<>
		<h1>Введите почту для восстановления пароля</h1>

		<form onSubmit={sendEmailFromForgotPass} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_email">Электронная почта: </label>
                <input 
                	placeholder="e-mail"
                	name="email"                	
                    type="email"
                    id="id_email"
                    className="control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                            
                                
                />

                <br/><br/>
                

                <button type="submit">
                    Восстановить пароль
                </button>

            </form>

            




		</>
		)



}




