import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'







export default function Registration_verify() {
	const {token} = useParams();
	const [res, setRes] = useState("")

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

    async function activ() {
    	try {
    		await fetch(`http://127.0.0.1:8000/api/regusers/verification/check_user/${token}`)
    		console.log("Успешно");
    		setRes("Успешно")
    		} catch (error) {
      		console.error("Плохо");
      		setRes("Все плохо")
    		}
    }




	return (
		<>
		<h1>Завершение регистрации</h1>

		<button onClick={activ}>РЕГА</button>

		<h2>{res}</h2>
		

		</>
		)

}

// у меня пока что проверка на пустое поле работает только на поле имени name остальные поля не валидируются. Пока так оставил.


