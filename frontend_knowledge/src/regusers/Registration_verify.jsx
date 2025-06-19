import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'







export default function Registration_verify() {
	const {token} = useParams();
	const [res, setRes] = useState("")

// http://127.0.0.1:8000/api/regusers/verification/check_user/
// ост тут, делаю переход по ссылке с бэка в юзэффекте, а на почту будет отправляться роут с фронта
	
	// const navigate = useNavigate();

    // const goEnter = () => {
    //   return navigate("/regusers/authorization/");
  	// }


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
    		console.log("Пользователь активирован успешно");
    		setRes("Пользователь активирован. Перейдите на страницу входа. ")


    		} catch (error) {
      		console.error("Плохо");
      		setRes(`Ошибка при активации пользователя: ${error}`)
    		}
    }




	return (
		<>
		<br/>
		<div className='registration-section'>
		<h1>Завершение регистрации</h1>

		<br/>
		<button onClick={activ} className="save-button">Подтвердить регистрацию</button>

		<h2>{res}</h2>
		
		</div>

		</>
		)

}

// у меня пока что проверка на пустое поле работает только на поле имени name остальные поля не валидируются. Пока так оставил.


