import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, NavLink, useNavigate, redirect } from 'react-router-dom'
import axios from "axios";
import Cookies from "js-cookie";
// import { API } from "../apiAxios/apiAxios"
// import { setAccessToken, setRefreshToken } from "./AuthService"
import { jwtDecode } from 'jwt-decode'
import GroupsAll from "./Groups"
// import { useAuth } from './AuthProvider'



export default function GroupDelete() {
    //поля формы    
    const [group, setGroup] = useState("");    

    //для выпадающего списка с группами
    const [listGroups, setListGroups] = useState([]);

    //тут состояния ошибки и загрузки
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    
    // const { login } = useAuth();

    useEffect(() => {
            fetch(`http://127.0.0.1:9999/api/get_group/`)
                .then(res => res.json())
                .then(data => setListGroups(data));        
        }, [])


    const validateForm = () => {
        if (!group) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

    const navigate = useNavigate();

    // const goHome = () => navigate("/");
    

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('group', group);
        

        try {            
            const response = await axios.post(
                "http://127.0.0.1:9999/api/delete_group/",
                formData,
                
                    // { withCredentials: true }
                );
            setLoading(false);
                
            // если возвращается в ответе объект группы, то делаем редирект на выбор другой группы для переноса товаров с фильтром товаров по возвращаемой группе



            if (response.data["answer"] ==='delete') {            
                
                //если все ок, то переходим в список товаров                
                navigate("/goods_all/");

            } else {
                // redirect
                navigate(`/groups/selectgroupafterdelete/${response.data["answer"]}`);
                // const errorData = await response.data
                // console.log(errorData, 'тут ошибка после ввода кредов')
                // setError(errorData.detail || 'аутентификация не прошла');
            }
    
        

        } catch (error) {
            setLoading(false);
            console.log(error)
            setError('что-то пошло не так');            
        }
    
    };

    
    return (
        <>

        <GroupsAll />
        
        <h1>Выберите группу для удаления</h1>

        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                                

                <label htmlFor="id_group">Группа: </label>                
                <select
                    name="group"
                    id="id_group"
                    // className="control"                        
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}   
                    // required
                >
                    <option value="">Выберите группу</option>
                    {listGroups?.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name_group}
                        </option>
                    ))}
                </select>

                <br/><br/>

                <button type="submit" disabled={loading}>                    
                    {loading ? 'Загрузка...' : 'Удалить'}
                </button>
                <br/>

                {/*если ошибка error отображаем ее в параграфе ниже*/}
                {error && <p style={{ color: 'red'}}>{error}</p>}

            </form>

        </>
        )



}



