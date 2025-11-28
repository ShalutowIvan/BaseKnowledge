import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLoaderData, useRevalidator, Outlet, useOutletContext } from 'react-router-dom'

// import { json } from 'react-router-dom/static';
// import { json } from "react-router-dom"
// import { json } from "react-router-dom/server";

// import { json } from "./jsonUtils/jsonUtils";

import { TaskCreateModal } from './TaskCreateModal'
import { useRoleStore } from './axiosRole/RoleStore';
import { ROLES_USERS } from "./axiosRole/RoleService"
import { axiosRole } from "./axiosRole/axiosRole"

import { CollapsibleText } from './CollapsibleText';


function SectionOpen() {    
    //глобальное состояние роли из zustand
    const userRole = useRoleStore(state => state.role);

    const { updateSectionInList, deleteSectionInList } = useOutletContext();

    const { taskLoad, sectionLoad } = useLoaderData();
    const { section_id, project_id } = useParams();
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки проекта    
    
    const [section, setSection] = useState(null)
    const [tasks, setTasks] = useState([]);
   
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [headerLoading, setHeaderLoading] = useState(false);    
    
    const navigate = useNavigate();    

    if (taskLoad.error === "role_denied") {
      return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>У вас нет доступа к проекту!</h1>  
    }

    if (sectionLoad.error === "role_denied") {
      return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>У вас нет доступа к проекту!</h1>      
    }     

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);                
                if (sectionLoad && !sectionLoad.error) {
                    setSection(sectionLoad);
                }
                if (taskLoad && !taskLoad.error) {                   
                    const tasksArray = Array.isArray(taskLoad) ? taskLoad : [];
                    setTasks(tasksArray);
                  }                
            } catch (err) {
                setError("Ошибка загрузки данных");
            } finally {
                setLoading(false);
            }
        };        
        fetchData();
    }, [section_id]);
    
    
    //удаление секции
    const deleteSection = async () => {
      if (window.confirm('Вы уверены, что хотите удалить?')) {
        try {
          await axiosRole.delete(`/delete_section/${project_id}/${section_id}`,
            { params: {project_id: project_id} }
            );          
          // Возвращаемся к списку разделов
          navigate(`/projects/open/${project_id}`);
          //   , {
          //   state: { deletedSectionId: section_id }, // Передаем ID удаленной секции
          //   replace: true, // Важно: заменяем текущую запись в истории
          //   preventScrollReset: true
          // });
          deleteSectionInList(section.id)
        } catch (error) {
          console.error('Error whith delete section:', error);
          setError(`Ошибка при удалении раздела:${error.message}`)
        }
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

  // функция чтобы работало редактирование формы во всех полях
  const handleHeaderChangeS = (e) => {
    const { name, value } = e.target;
    setSection(prev => ({
      ...prev,
      [name]: value
    }));
  };  

  //функция для сохранения на сервере формы шапки
  const saveHeaderChanges = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        try {            
            setHeaderLoading(true);
            
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
                const updatedSection = { 
                    ...section, 
                    title: section.title,
                    description: section.description,
                    // updated_at: response.data.updated_at
                };
                updateSectionInList(updatedSection);
                console.log("Update complete!")                
            } 
            // else {
            //     const errorData = await response.data
            //     console.log(errorData, 'тут ошибка')     
            // }
        } catch (error) {            
            console.log(error.error_code)              
            setError(error.message)  
        } finally {
          setHeaderLoading(false);
        }    
    };

      
  const [modalOpen, setModalOpen] = useState(false);
  
  const openModalClick = () => {	    
        setModalOpen(true);
        };
  
  const handleCreateSuccess = (newTask) => {            
      setTasks(prevTasks => [...prevTasks, newTask]);
      setModalOpen(false);
      };

  const goSectionList = () => {
      return navigate(`/projects/open/${project_id}`);
    }

  const TASK_STATES = {
      NEW: 'new',
      AT_WORK: 'at_work',
      COMPLETED: 'completed'
    };

  const updateTaskInList = (updatedTask) => {
    setTasks(prevTasks => 
        prevTasks.map(task => {
            if (task.id === updatedTask.id) {
                return {
                    ...task,
                    title: updatedTask.title,
                    description: updatedTask.description
                };
            }
            return task; // возвращаем неизмененную задачу, если ID не совпадает
        })
    );
  };

  //функция для удаления таски в состоянии
  const deleteTaskInList = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  


  if (!section) {
      return <div>Загрузка...</div>;
  }

  // Если есть ошибка, показываем её
  if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
    }
      
  return (
    <div className='container-project-section-view'>
      {userRole === ROLES_USERS.GUEST ? 
      (<h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>У вас нет прав для проекта</h1>) 
      : (
      // <div className='header-chapter'>
      <div className='section-middle'>
        
        <div className="project-section">
          {/*это шапка раздела*/}  
          {/*начало шапки*/}
          {/*если не редачим шапку отображаются поля шапки*/}
          {!editModeHeader ? (
            <>          
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
              <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {new Date(section.created_at).toLocaleString('ru-RU')}</span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
              <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{section.title}</span>

            </div>
            <br/>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  {/* Используем компонент для описания */}
                    <div style={{ flex: 1 }}>
                        <CollapsibleText 
                            text={section?.description}
                            maxLines={3}
                            style={{
                                fontSize: '20px',
                                color: '#E0FFFF'
                            }}
                        />
                    </div>
              
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

                    <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {new Date(section.created_at).toLocaleString('ru-RU')}</span>
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
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <textarea
                        placeholder="введите описание"
                        name="description"
                        value={section.description}
                        onChange={handleHeaderChangeS}
                        disabled={headerLoading}
                        rows={4} // Увеличиваем количество строк
                        style={{ 
                            flex: 1,
                            whiteSpace: 'pre-wrap', // Сохраняет переносы при редактировании
                            minHeight: '100px',
                            resize: 'vertical' // Позволяет растягивать по вертикали
                        }}
                    />
                  
                    <div style={{ marginLeft: '16px' }}>
                    <button className="save-button" type="submit" disabled={headerLoading}>                    
                      {headerLoading ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                    &nbsp;&nbsp;
                    <button 
                      // тут при отмене должны возвращаться предыдущие значения, я сдела просто отмену
                      onClick={() => {setEditModeHeader(false);}}
                      className="cancel-button"
                      disabled={headerLoading}>Отмена</button>
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
              <button onClick={goSectionList} className="toolbar-button">Закрыть</button>
              <button className="cancel-button" onClick={deleteSection}>Удалить раздел</button>
            </div>
            <h1>Задачи в разделе</h1>
            <p>______________________________________________________</p>
            {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
            <button className="save-button" onClick={openModalClick}>Добавить задачу</button>}

            {modalOpen && (
              <TaskCreateModal
                section_id={section_id}
                project_id={project_id}
                onClose={() => setModalOpen(false)}
                onSuccess={handleCreateSuccess}
              />
            )}			      
          <br/><br/>
                  
            {
                  tasks.length === 0 ? (<div className="name-knowledge">В этом разделе пока нет задач. Попробуйте обновить страницу.</div>)
                  : 
                  (tasks?.map(task => (
                          <>                            
                            <NavLink 
                              key={task.id}
                              to={`/projects/open/${section.project_id}/section_open/${section_id}/task_open/${task?.id}`}
                              style={{ textDecoration: 'none' }}
                            >
                              {({ isActive }) => (
                            <div className={`list-stage project-section ${isActive ? "active" : ""}`}>
                              <div className="name-knowledge" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>                            
                                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Название: {task.title}</span>
                                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                                  Статус: &nbsp;
                                  {task.state === TASK_STATES.NEW && 'Новая'}
                                  {task.state === TASK_STATES.AT_WORK && 'В работе'}
                                  {task.state === TASK_STATES.COMPLETED && 'Завершена'}
                                </span>
                              </div>                          
                              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Описание:                                 
                                <div style={{ flex: 1 }}>
                                    <CollapsibleText 
                                        text={task.description}
                                        maxLines={2}
                                        style={{
                                            fontSize: '15px',
                                            color: '#E0FFFF'
                                        }}
                                    />
                                </div>
                                
                              </span>
                              
                              
                              
                              <br/>                              
                                <button className="toolbar-button">Открыть</button>                              
                              </div>                            
                              )}
                          </NavLink>

                          </>
                      ))
                    )                  
              }           
          
      </div>     
      )
      }

      <div>
        <Outlet context={{ updateTaskInList, deleteTaskInList }} />
      </div>

    </div>
    )
}


async function getSection(section_id, project_id) { 
  
  try {        
        const responseSection = await axiosRole.get(`/section_get/${project_id}/${section_id}`,
              {
                params: {project_id: project_id}
              }
          );
        return responseSection.data
      } catch (error) {
        return {"error": error.response?.data?.detail.error_code}
      }  
  }


async function getTasks(section_id, project_id) {  
  try {        
        const responseTasks = await axiosRole.get(`/task_section_all/${project_id}/${section_id}`,
              {
                params: {project_id: project_id}
              }
          );
        return responseTasks.data
      } catch (error) {        
        return {"error": error.response?.data?.detail.error_code}
      }
  }


const SectionOpenLoader = async ({params}) => {  
  const section_id = params.section_id
  const project_id = params.project_id

  const requestSection = await getSection(section_id, project_id)

  const requestTasks = await getTasks(section_id, project_id)  

  return {
    taskLoad: requestTasks,
    sectionLoad: requestSection
  }
}



export { SectionOpen, SectionOpenLoader };


// (tasks?.map(task => (
//         <>                          
//           <h1 className="name-knowledge">{task.title}</h1>
//           <h3>Описание: {task.description}</h3>
//           <h3>Статус: {task.state}</h3>
//           <NavLink className={({ isActive }) => 
//                 isActive ? "active" : ""
//               } key={task.id} to={`/projects/open/${section.project_id}/section_open/${section_id}/task_open/${task?.id}`}>
              
//               <button className="toolbar-button">Открыть</button>
//           </NavLink>
//           <p>______________________________________________________</p>                          
//         </>
//     ))
//   )