import { useState, useRef } from 'react'
import axios from "axios";







export default function Registration() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    

	// const [form, setForm] = useState({
    //     name: "",
    //     email: "",
    //     password1: "",
    //     password2: "",        
    // })
    // hasError: false,

	// function handleNameChange(event) {
        
    //     setForm((prev) => ({
    //         ...prev,
    //         name: event.target.value,
    //         hasError: event.target.value.trim().length === 0,
    //     })

    //         )
    // }

    
    // const handleRegister = async (e) => {
    //     e.preventDefault();
    //     try {
    //         const response = await axios.post("http://127.0.0.1:8000/api/regusers/registration", { 
    //             name: form.name, 
    //             email: form.email, 
    //             password1: form.password1, 
    //             password2: form.password2, });
    //     console.log("Registration successful:", response.data);
    //     } catch (error) {
    //     console.error("Registration failed:", error.response.data);
    //     }
    // };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {            
            const response = await axios.post("http://127.0.0.1:8000/api/regusers/registration", { 
                name, 
                email, 
                password1, 
                password2, });
        console.log("Registration successful:", response.data);
        } catch (error) {
        console.error("Registration failed:", error.response.data);
        }
    };




// onChange={ handleNameChange }     
// style={{
//                         border: form.hasError ? '2px solid red' : null,
//                     }}              



// Ошибка
// ←[32mINFO←[0m:     127.0.0.1:63981 - "←[1mPOST /api/regusers/registration HTTP/1.1←[0m" ←[31m422 Unprocessable Entity←[0m



	return (
		<>
		<h1>Регистрация</h1>

		<form onSubmit={handleRegister} style={{ marginBottom: '1rem' }}>
                <label htmlFor="id_name">Ваше имя: </label>
                <input 
                	placeholder="введите ФИО"
                	name="name"
                    type="text"
                    id="id_name"
                    className="control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                        
                    
                />

                <br/>

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

                <br/>

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
                    Зарегистрироваться
                </button>

            </form>

            {/*
            <h1>{name}</h1>
            <h1>{email}</h1>
            <h1>{password1}</h1>
            <h1>{password2}</h1>*/}





		</>
		)

}

// у меня пока что проверка на пустое поле работает только на поле имени name остальные поля не валидируются. Пока так оставил.

//нужно сделать увед что нужно перейти на почту и перейти по ссылке. И сделать так, чтобы ссылка для верификации работала на реакте
// ссылка с бэка на почту должна отплавляться на роутер фронта, а фронт должен обработать ее и сделать запрос на бэк

// disabled={form.hasError} это было в кнопке button
// isActive={!form.hasError} это там же


// это ончейнж с объектом setForm
                // onChange={
                //         (e) => {
                //         setForm ( (prev) => ({
                //         password2: e.target.value
                //         })
                //         )
                //             }
                //     } 