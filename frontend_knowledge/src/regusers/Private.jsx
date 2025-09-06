import { useLocation, Navigate} from 'react-router-dom'
import { useAuth } from './AuthProvider'


const Private = ({ children }) => {
	const location = useLocation()
	const {user} = useAuth()
	//возможно тут стоит прописать логику обновления аксеса токена по рефреш токену через интерцептор
	if (!user) {//если тру то возвращаем компонент Navigate. Если фолз, то что то другое. То что будет возвращать компонент аутха
		return <Navigate to='/regusers/authorization/' state={{from: location}} />
	}

	return children


}


export { Private }



