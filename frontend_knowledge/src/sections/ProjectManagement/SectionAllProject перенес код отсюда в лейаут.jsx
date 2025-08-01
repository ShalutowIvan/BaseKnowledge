import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, NavLink, useNavigate, useLoaderData, Await, redirect, useRevalidator } from 'react-router-dom'
import { SectionCreateModal } from './SectionCreateModal'
import { API } from "../../apiAxios/apiAxios"
import { axiosRole } from "./axiosRole/axiosRole"
import Cookies from "js-cookie";
import { getRoleToken, roleTokenVerify } from "./axiosRole/RoleService"
import { jwtDecode } from 'jwt-decode';
import { ROLES_USERS } from "./axiosRole/RoleService"
import { useRoleStore } from './axiosRole/RoleStore';


function SectionAllProject({ project_id }) {
    // const revalidator = useRevalidator();

    // const { sectionLoad, project_id } = useLoaderData();//лоадер содержания проекта, грузим разделы
    
    // const [userRole, setUserRole] = useState("")
    const setRole = useRoleStore(state => state.setRole);
    const userRole = useRoleStore(state => state.role);

    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки раздела

    // const project_id = useParams();
    const [project, setProject] = useState("")//тут будет объект проекта из таблицы Project для шапки раздела

    
    const navigate = useNavigate();

    const [sections, setSections] = useState([]);

    const toProjects = () => {
      return navigate("/projects/");}
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [visibleProject, setVisibleProject] = useState(true)


    useEffect(() => {
        const fetchData = async () => {
        try {
          const responseProject = await API.get(`http://127.0.0.1:8000/project_get/${project_id}`);
          setProject(responseProject.data);

          const responseSections = await API.get(`http://127.0.0.1:8000/section_project_all/${project_id}`);
          setSections(responseSections.data);

          

          //начало работы с токеном
          //берем токена проекта
          let RoleToken = await getRoleToken(project_id);
          
          //тут условие если токена не было и его запросили, а пользователь не добавлен в проект          
          if (RoleToken === "access_denied"){
            setVisibleProject(false)
          }
          
          //тут проверка уже выданного токена. Если он не принадлежит данному проекту, то запрашиваем новый                    
          if (roleTokenVerify(project_id)) {            
            Cookies.remove("Project_token");
            const RoleToken = await getRoleToken(project_id);
            if (RoleToken === "access_denied"){
              setVisibleProject(false)
            }
          }
          // const decoded = jwtDecode(RoleToken);
          // setUserRole(decoded.role)
          setRole(RoleToken)

          setError("")
          setLoading(false);
        } catch (error) {
          // setError(err);
          // error.response.data.detail.error_code
          if (error.response.data.detail.error_code === "access_denied") {
            setVisibleProject(false)
          }

          setLoading(false);
        }
        };

        fetchData();

      }, [userRole])

    
    

    //удаление проекта, сделать позже
    const deleteProject = () => {
      if (window.confirm('Вы уверены, что хотите удалить?')) {
        // Действие при подтверждении
        axiosRole.delete(`http://127.0.0.1:8000/delete_project/${project_id}`)      
        navigate("/projects/");
        revalidator.revalidate();//принудительная перезагрузка лоадера
      }  
    };


  const validateForm = () => {
        if (!project.title || !project.description ) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({
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
            
            const response = await axiosRole.patch(
                `/project_update_header/${project_id}`,                 
                { title: project.title, description: project.description }, 
                {
                  params: {project_id: project_id},
                }
                
                );
            setEditModeHeader(false)
            setError("")   
            if (response.statusText==='OK') {               
                console.log("Update complete!")                
            } else {
                const errorData = await response.data
                console.log('тут ошибка', errorData)
            }
        } catch (error) {
            if (error.status===403 || error.status===404) {
              // Ошибка от сервера (4xx/5xx)
              console.log(error.error_code)              
              setError(error.message)            
            } else {
              setError(error.errorDetail);
            }

          // if (error.status === 403) {
          //     setError(error.message);
          //   } else {
          //     setError(error.message || 'Ошибка при загрузке');
          //   }

          //   console.log(error)
            // setError('что-то пошло не так');            
        } finally {
          setLoading(false);
        }    
    };

  const [modalOpen, setModalOpen] = useState(false);

  const openModalClick = () => {	    
	    setModalOpen(true);
	  	};

  const handleCreateSuccess = (newSection) => {
		// Используем функциональную форму setProjects
		
		setSections(prevSections => [...prevSections, newSection]);
		setModalOpen(false);
		};

  const usersInvite = () => {
      return navigate(`/projects/open/${project_id}/users_invite/`);}
  


  if (!visibleProject) {
      return (
        <div>
        <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>У вас нет доступа к проекту!</h1>
        </div>
        )
    }    


  

  return (
    <>


    <aside>
          <p>{userRole}</p>
          <br/><br/>
          <button onClick={toProjects} className="toolbar-button">К списку проектов</button>
          <br/><br/>

          {/* шапка проекта */}
          <div>
          <div className="project-section header-project">
            {/*это шапка проекта*/}  
            {/*начало шапки*/}
            {/*если не редачим шапку отображаются поля шапки*/}
            {!editModeHeader ? (
              <>          
              <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Название проекта:</span>
              <br/>  
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{project.title}</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#5F9EA0' }}>Дата создания: </span>
              <br/>
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{project.created_at}</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{project.description}</span>
              <br/><br/>
              {
                (userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) && 
                  <button onClick={() => setEditModeHeader(true)} className="toolbar-button">
                    Редактировать шапку
                  </button>
              }
              
              
              </>
              ) : (
              <>
              {/*отображаются поля формы если редактируем шапку*/}
              {/*начало формы*/}
              
              <form onSubmit={saveHeaderChanges} style={{ marginBottom: '1rem' }}>

                    {/*первая строка без формы*/}
                    
                    <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Название проекта:</span>
                    <br/>
                    {/*вторая строка с формой названия проекта*/}
                    
                        <input 
                            placeholder="введите назвнаие"
                            name="title"
                            type="text"
                            value={project.title}                        
                            onChange={handleHeaderChange}
                            disabled={loading}
                        />                
                        
                    
                    <br/>

                    <span style={{ fontSize: '16px', color: '#5F9EA0' }}>Дата создания: </span>
                    <br/>
                    <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{project.created_at}</span>

                    {/*третья строка */}
                    <br/>
                    <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
                    <br/>
                    

                    {/*четвертая строка с формой описания проекта*/}
                      <textarea
                        placeholder="введите описание"
                        name="description"
                        value={project.description}
                        onChange={handleHeaderChange}
                        disabled={loading}
                        rows={2}
                      />
                    <br/>
                      
                      <button className="save-button" type="submit" disabled={loading}>                    
                        {loading ? 'Сохраняем...' : 'Сохранить'}
                      </button>
                      &nbsp;&nbsp;
                      <button 
                        // тут при отмене должны возвращаться предыдущие значения, я сдела просто отмену
                        onClick={() => {setEditModeHeader(false);}}
                        className="cancel-button"
                        disabled={loading}>Отмена</button>
                      
                    
                    {/*конец четвертой строки*/}
                  {error && 
                  <div>
                  <p style={{ color: 'red'}}>{error}</p> 
                  </div>}
                </form>

              {/*конец формы*/}

                      
              </>
                )
              }
            </div>  

            <br/>
              
            
        </div>
    {/* конец шапки проекта */}

          {userRole === ROLES_USERS.ADMIN && <button onClick={usersInvite} className="toolbar-button">Пользователи в проекте</button>}
          
          
          
          <p>_________________________________</p>
          <h1>Разделы проекта</h1> 
          {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
           <>           
           <button className="toolbar-button" onClick={openModalClick}>Добавить раздел</button>
           </>
          }
          
			        
        <br/><br/>
          {(userRole !== ROLES_USERS.GUEST) && 
          <>
          {
                sections?.map(section => (
                  <>
                  <NavLink 
                    key={section.id}
                    to={`/projects/open/${project_id}/section_open/${section.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {({ isActive }) => (
                      <div className={`list-section project-section ${isActive ? "active" : ""}`}>
                        <h2 className="name-knowledge">{section.title}</h2>
                        <label>Описание: </label>{section.description}
                        <br/><br/>
                        <button className="toolbar-button">Открыть</button>
                        
                      </div>                     
                      
                    )}
                  </NavLink>
                  
                  </>
                ))
            }

          {modalOpen && (
		        <SectionCreateModal
		          project_id={project_id}
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleCreateSuccess}
		        />
		      )}

          </>
          }

    </aside>

               
    </>
    )
}


// async function getProjectOpen(id) { 
//   const res = await fetch(`http://127.0.0.1:8000/section_project_all/${id}`)

//   // try {
//   //       const res = await API.get(`/api/checkout_list/orders/${id}`)     
//   //  return res.data
//   //     } catch (error) {
//   //      //если ошибка, то выдаем ошибку
//   //       console.error("Error here: ", error);
//   //       // setError("Failed to fetch user data. Please try again.");
//   //       return "error"
//   //     }


//   return res.json()
// }


// const SectionAllProjectLoader = async ({params}) => {
  
//   const project_id = params.id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
//   return {sectionLoad: await getProjectOpen(project_id), project_id: project_id}
// }



export { SectionAllProject };