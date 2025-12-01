import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, NavLink, useNavigate, redirect, useParams } from 'react-router-dom'
import axios from "axios";
// import Cookies from "js-cookie";
import { API } from "../../apiAxios/apiAxios"



function TaskCreate() {
    // это поля формы
    const [title, setTitle] = useState("_");    
    const [description, setDescription] = useState("_");    
    
    const { section_id } = useParams();
    
    //тут состояния ошибки и загрузки
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    
    // const { login } = useAuth();

    const validateForm = () => {
        if (!title || !description) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

    const navigate = useNavigate();

    const goBack = () => {
      return navigate(`/project/section/open/${section_id}`);}
  

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/task_create/${section_id}`,
                {                 
                    title,
                    description,
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
                // navigate(`/knowledge/open/${response.data["id"]}`);
                navigate(`/project/section/open/${section_id}`);

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
        <div className="list-knowledge">
            <h1>Создание задачи</h1>
            <button onClick={goBack} className="toolbar-button">Назад</button>
            <br/><br/>
            <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_title">Заголовок задачи: </label>
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

export { TaskCreate };