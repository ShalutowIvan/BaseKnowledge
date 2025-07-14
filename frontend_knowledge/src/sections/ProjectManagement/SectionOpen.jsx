import { useState, useEffect } from 'react';

import axios from 'axios';
import { NavLink, useNavigate, useParams, useLoaderData, useRevalidator } from 'react-router-dom'
import { TaskCreateModal } from './TaskCreateModal'


function SectionOpen() {
    // const revalidator = useRevalidator();    

    // const { taskLoad, section_id } = useLoaderData();//лоадер содержания проекта, грузим разделы
    const { section_id } = useParams();
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки проекта

    // const project_id = useParams();
    const [section, setSection] = useState({})//фигурные скобки означают что тут объект

    const [tasks, setTasks] = useState([]);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
            fetch(`http://127.0.0.1:8000/section_get/${section_id}`)
                .then(res => res.json())
                .then(data => setSection(data));            
        }, [section_id])


    useEffect(() => {
    const fetchTasks = async () => {
        const res = await fetch(`http://127.0.0.1:8000/task_section_all/${section_id}`);
        const data = await res.json();
        setTasks(data);
    };
    fetchTasks();
    }, [section_id]);

    const navigate = useNavigate();
    
    const goBack = () => {      
      return navigate(`/project/open/${section.project_id}`);}
    
    
    

    //удаление проекта, сделать позже
    const deleteSection = () => {
      if (window.confirm('Вы уверены, что хотите удалить?')) {
        // Действие при подтверждении
        axios.delete(`http://127.0.0.1:8000/delete_section/${section_id}`)   
        navigate(`/projects/open/${section.project_id}`);//тут может быть ошибка, так секцию то мы удалили уже...
        // revalidator.revalidate();//принудительная перезагрузка лоадера
      }  
    };


  const validateForm = () => {
        if (!section.title || !section.description ) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

  const handleHeaderChangeS = (e) => {
    const { name, value } = e.target;
    setSection(prev => ({
      ...prev,
      [name]: value
    }));
  };

  
  //функция для формы шапки
  const saveHeaderChanges = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        try {            
            setLoading(true);
            
            const response = await axios.patch(
                `http://127.0.0.1:8000/section_update_header/${section_id}`,
                {
                  title: section.title,
                  description: section.description
                }                
                );
            setEditModeHeader(false)            
            if (response.statusText==='OK') {                
                console.log("Update complete!")                
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {            
            console.log(error)
            setError('что-то пошло не так');            
        } finally {
          setLoading(false);
        }    
    };


    const create_task = () => {
      return navigate(`/project/section/task/create/${section_id}`);
    }

  
  const [modalOpen, setModalOpen] = useState(false);
  
    const openModalClick = () => {	    
        setModalOpen(true);
        };
  
    const handleCreateSuccess = (newTask) => {            
      setTasks(prevTasks => [...prevTasks, newTask]);
      setModalOpen(false);
      };
 
      
  return (
    <>
    
    <div className='header-chapter'>
      <div className="project-section">
        {/*это шапка раздела*/}  
        {/*начало шапки*/}
        {/*если не редачим шапку отображаются поля шапки*/}
        {!editModeHeader ? (
          <>          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название раздела:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {section.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{section.title}</span>

          </div>
          <br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>

          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{section.description}</span>
            
            <button onClick={() => setEditModeHeader(true)} className="toolbar-button">
              Редактировать шапку
            </button>            
          </div>
          </>
          ) : (
          <>
          {/*отображаются поля формы если редактируем шапку*/}
          {/*начало формы*/}
          
          <form onSubmit={saveHeaderChanges} style={{ marginBottom: '1rem' }}>

                {/*первая строка без формы*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название раздела:</span>
                  <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {section.created_at}</span>
                </div>

                {/*вторая строка с формой названия секции*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>                  
                    <input 
                        placeholder="введите назвнаие"
                        name="title"
                        type="text"
                        value={section.title}                        
                        onChange={handleHeaderChangeS}
                        disabled={loading}
                    />                
                    
                </div>
                <br/>

                {/*третья строка с чекбоксом*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
                                    
                </div>

                {/*четвертая строка с формой описания секции*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <textarea
                    placeholder="введите описание"
                    name="description"
                    value={section.description}
                    onChange={handleHeaderChangeS}
                    disabled={loading}
                    rows={2}
                  />
                
                  <div>
                  <button className="save-button" type="submit" disabled={loading}>                    
                    {loading ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  &nbsp;&nbsp;
                  <button 
                    // тут при отмене должны возвращаться предыдущие значения, я сдела просто отмену
                    onClick={() => {setEditModeHeader(false);}}
                    className="cancel-button"
                    disabled={loading}>Отмена</button>
                  </div>                  
                </div>
                {/*конец четвертой строки*/}
              {error && <p style={{ color: 'red'}}>{error}</p>}
            </form>

          {/*конец формы*/}

                  
          </>
            )
          }
        </div>  

        <br/>
                
          {/* <button onClick={goBack} className="toolbar-button">Назад</button>           */}
          <h1>Задачи в разделе</h1>
          <p>______________________________________________________</p>
          <button className="toolbar-button" onClick={openModalClick}>Добавить задачу</button>

          {modalOpen && (
		        <TaskCreateModal
		          section_id={section_id}
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleCreateSuccess}
		        />
		      )}


			      
        <br/><br/>
                
          {
                tasks?.map(task => (
                				<>
                        {/* <div className='project-section'> */}
                          <h1 className="name-knowledge">{task.title}</h1>
                          <h2>Описание: {task.description}</h2>
                          <NavLink className={({ isActive }) => 
                                isActive ? "active" : ""
                              } key={task.id} to={`/projects/open/${section.project_id}/section_open/${section.id}/task_open/${task.id}`}>
                              <button className="toolbar-button">Открыть</button>
                          </NavLink>
                          <p>______________________________________________________</p>
                        {/* </div> */}
                        {/* <br/> */}
                        </>
                    ))
            }


            
        
    </div>             
    </>
    )
}


async function getSectionOpen(section_id) { 
  const res = await fetch(`http://127.0.0.1:8000/task_section_all/${section_id}`)

  // try {
  //       const res = await API.get(`/api/checkout_list/orders/${id}`)     
  //  return res.data
  //     } catch (error) {
  //      //если ошибка, то выдаем ошибку
  //       console.error("Error here: ", error);
  //       // setError("Failed to fetch user data. Please try again.");
  //       return "error"
  //     }


  return res.json()
}


const SectionOpenLoader = async ({params}) => {
  
  const section_id = params.section_id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  return {taskLoad: await getSectionOpen(section_id), section_id: section_id}
}



export { SectionOpen, SectionOpenLoader };