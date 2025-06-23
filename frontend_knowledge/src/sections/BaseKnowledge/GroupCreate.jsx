import { useState } from 'react'
import { Link, Outlet, NavLink, useNavigate, redirect } from 'react-router-dom'
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from 'jwt-decode'
import { GroupsAll } from "./GroupsAll"
// import { useAuth } from './AuthProvider'



function GroupCreate() {
    //поля формы
    const [name_group, setName_group] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    
    // const { login } = useAuth();


    const validateForm = () => {
        if (!name_group) {
            setError("Не введено название группы");
            return false;
        }
        setError('');
        return true;
    }

    const navigate = useNavigate();

    const goBack = () => {
      return navigate(-1);}

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {            
            const response = await axios.post(
                "http://127.0.0.1:8000/group_create/",
                {                 
                name_group,                
                },
                    // { withCredentials: true }
                );
            setLoading(false);
            
            if (response.statusText==='OK') {            
                
                //если все ок, то переходим в список товаров                
                // navigate("/knowledges/");
                navigate('/knowledges', { 
                  state: { needsRefresh: true } // Флаг для обновления
                });
                

            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка после ввода кредов')
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
        {/*<aside>
        <GroupsAll />
        </aside>*/}

        <div className="list-knowledge">
            <h1>Создание группы</h1>
            <button onClick={goBack} className="toolbar-button">Назад</button>
            <br/><br/>
            <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_name_group">Название группы: </label>
                <input 
                    placeholder="введите название группы"
                    name="name_group"                    
                    type="text"
                    id="id_name_group"
                    className="control"                        
                    value={name_group}
                    onChange={(e) => setName_group(e.target.value)}   
                />

                <br/><br/>                

                <button className="save-button" type="submit" disabled={loading}>                    
                    {loading ? 'Сохраняем...' : 'Добавить'}
                </button>
                <br/>

                {/*если ошибка error отображаем ее в параграфе ниже*/}
                {error && <p style={{ color: 'red'}}>{error}</p>}

            </form>
        </div>
        </>
    )

}


export { GroupCreate }