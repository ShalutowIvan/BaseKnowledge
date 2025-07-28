import { useState, useEffect } from 'react';

import axios from 'axios';
import { NavLink, useNavigate, useParams, useLoaderData, useRevalidator } from 'react-router-dom'
import { TaskCreateModal } from './TaskCreateModal'
import { useRoleStore } from './axiosRole/RoleStore';
import { ROLES_USERS } from "./axiosRole/RoleService"
import { axiosRole } from "./axiosRole/axiosRole"

function SectionOpen() {
    // const revalidator = useRevalidator();

    //глобальное состояние роли из zustand
    const userRole = useRoleStore(state => state.role);

    // const { taskLoad, section_id } = useLoaderData();//лоадер содержания проекта, грузим разделы
    const { section_id, project_id } = useParams();
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки проекта

    // const project_id = useParams();
    const [section, setSection] = useState(null)//фигурные скобки означают что тут объект

    const [tasks, setTasks] = useState([]);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();



    // useEffect(() => {
    //     const fetchSection = async () => {
    //         try {
    //             setLoading(true);
    //             const res = await fetch(`http://127.0.0.1:8000/section_get/${section_id}`);
    //             const data = await res.json();
    //             setSection(data);
    //         } catch (err) {
    //             setError("Ошибка загрузки данных раздела");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchSection();
    // }, [section_id]);


    // useEffect(() => {
    // const fetchTasks = async () => {
    //     const res = await fetch(`http://127.0.0.1:8000/task_section_all/${section_id}`);
    //     const data = await res.json();
    //     setTasks(data);
    // };
    // fetchTasks();
    // }, [section_id]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                const sectionRes = await fetch(`http://127.0.0.1:8000/section_get/${section_id}`);
                const sectionData = await sectionRes.json();
                setSection(sectionData);

                const tasksRes = await fetch(`http://127.0.0.1:8000/task_section_all/${section_id}`);
                const tasksData = await tasksRes.json();
                setTasks(tasksData);

            } catch (err) {
                setError("Ошибка загрузки задач");
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [section_id]);

     
    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             setLoading(true);
    //             const [sectionRes, tasksRes] = await Promise.all([
    //                 fetch(`http://127.0.0.1:8000/section_get/${section_id}`),
    //                 fetch(`http://127.0.0.1:8000/task_section_all/${section_id}`)
    //             ]);
                
    //             const sectionData = await sectionRes.json();
    //             const tasksData = await tasksRes.json();
                
    //             setSection(sectionData);
    //             setTasks(tasksData);
    //         } catch (err) {
    //             setError("Ошибка загрузки данных");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
        
    //     fetchData();
    // }, [section_id]);
    

    
    
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

  // тут криво работает, форма завершается когда должна отобразиться ошибка, глючит все, исправить.!!!!!!!!!!!!!!
  //функция для формы шапки
  const saveHeaderChanges = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        try {            
            setLoading(true);
            
            const response = await axiosRole.patch(
                `http://127.0.0.1:8000/section_update_header/${project_id}/${section_id}`,
                { title: section.title, description: section.description },
                {
                params: {project_id: project_id}
                }
                );
            
            setError("")
            if (response.statusText==='OK') {
                setEditModeHeader(false)

                console.log("Update complete!")                
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {            
            console.log(error.error_code)              
            setError(error.message)  
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


  if (loading || !section || tasks.length === 0) {
      return <div>Загрузка...</div>;
  }

    // Если есть ошибка, показываем её
    if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
    }



 
      
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
            
            {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
            <button onClick={() => setEditModeHeader(true)} className="toolbar-button">
              Редактировать шапку
            </button>
            }
            
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
          {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
          <button className="toolbar-button" onClick={openModalClick}>Добавить задачу</button>}

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
                              } key={task.id} to={`/projects/open/${section.project_id}/section_open/${section_id}/task_open/${task?.id}`}>
                              <h2>номер таски: {task?.id}</h2>
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


async function getSection(project_id) { 
  
  try {        
        
        const responseSection = await axiosRole.get(`http://127.0.0.1:8000/section_project_all/${project_id}`,
              {
                params: {project_id: project_id}
              }
          );

        return responseSections.data

      } catch (error) {
       
        // console.log("Ошибка из detail при запросе секций:", error.response?.data?.detail)
        // console.log("Статус ответа:", error.response?.status)       

        return {"error": error.response?.data?.detail.error_code}
      }  
}



// сделать нормально лоадер без гонок!!!!!!!!!!!!!!!
const SectionOpenLoader = async ({params}) => {
  
  const section_id = params.section_id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками

  // const sectionRes = await fetch(`http://127.0.0.1:8000/section_get/${section_id}`);
  // const sectionData = await sectionRes.json();
  // setSection(sectionData);

  // const tasksRes = await fetch(`http://127.0.0.1:8000/task_section_all/${section_id}`);
  // const tasksData = await tasksRes.json();
  // setTasks(tasksData);


  
  return {taskLoad: await getSectionOpen(section_id), section_id: section_id}
}



export { SectionOpen, SectionOpenLoader };