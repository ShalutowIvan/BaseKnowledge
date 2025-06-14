import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, NavLink, useNavigate, redirect } from 'react-router-dom'
import axios from "axios";
// import Cookies from "js-cookie";

import { GroupsAll } from "./GroupsAll"


function KnowledgeCreate() {
    // это поля формы
    const [title, setTitle] = useState("_");    
    const [description, setDescription] = useState("_");    
    const [group, setGroup] = useState(null);
    
    // это состояние для выпадающего списка
    const [groups, setGroups] = useState([]);

    


    //тут состояния ошибки и загрузки
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    
    // const { login } = useAuth();

    useEffect(() => {
            fetch(`http://127.0.0.1:8000/groups_all/`)
                .then(res => res.json())
                .then(data => setGroups(data));
        }, [])


    const validateForm = () => {
        if (!title || !description || !group) {
            setError("Есть пустые поля, заполните, пожалуйста!");
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
                "http://127.0.0.1:8000/knowledges_create/",
                {                 
                    title,                    
                    description,                    
                    group_id: group,
                }
                // {
                //     headers: {
                //         'Content-Type': 'multipart/form-data',  // важно для загрузки файлов
                //     },
                // }
                    // { withCredentials: true }
                );
            setLoading(false);
            
            if (response.statusText==='OK') {            
                
                //если все ок, то открываем знание для заполнения
                navigate(`/knowledge/open/${response.data["id"]}`);

            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error)
            setError('что-то пошло не так');            
        }
    
    };
    

    const buttonStyle = {
    padding: '6px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'white'
    };

    
  return (
    <>
        <aside>
        <GroupsAll />
        </aside>

        <div className="list-knowledge">
            <h1>Создание знания</h1>
            <button onClick={goBack} className="toolbar-button">Назад</button>
            <br/><br/>
            <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_title">Заголовок знания: </label>
                <input 
                    placeholder="введите заголовок"
                    name="title"
                    type="text"
                    id="id_title"
                    className="control"                        
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}   
                />

                <br/><br/>                

                <label htmlFor="id_description">Описание: </label>
                <input 
                    placeholder="введите описание"
                    name="description"
                    type="text"
                    id="id_description"
                    className="control"                        
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}   
                />

                <br/><br/>

                
                <label htmlFor="id_group">Группа: </label>                
                <select
                    style={buttonStyle}
                    name="group"
                    id="id_group"
                    // className="control"                        
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}   
                    // required
                >
                    <option value="">Выберите группу</option>
                    {groups?.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name_group}
                        </option>
                    ))}
                </select>

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

export { KnowledgeCreate };