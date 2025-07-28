import { useState, useEffect, useRef } from 'react';
import { useParams, Link, NavLink, useNavigate, useLoaderData, Await, redirect, useRevalidator, Outlet } from 'react-router-dom'
import { SectionCreateModal } from './SectionCreateModal'
import { API } from "../../apiAxios/apiAxios"
import { axiosRole } from "./axiosRole/axiosRole"
import Cookies from "js-cookie";
import { getRoleToken, ROLES_USERS } from "./axiosRole/RoleService"
import { useRoleStore } from './axiosRole/RoleStore';
import { jwtDecode } from 'jwt-decode';


//тут компонент отрисовывается при открытии проекта с Outlet в середине, который будет меняться при открытии разделов или других частей в проекте. 

function ProjectOpenLayout() {
  const { project_id } = useParams();

  const { projectLoad, sectionLoad, roleTokenLoad } = useLoaderData();

  //проверка есть ли ошибка авторизации
  if (projectLoad.error === "401_UNAUTHORIZED") {  
    return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {projectLoad["error"]}. Пройдите авторизацию.</h1>
    }

  // if (sectionLoad.error) {
  //   return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {sectionLoad.error}. Роль не соответсвует.</h1>
  //   }

  

  //проверка роли
  if (roleTokenLoad.error === "access_denied") {
    return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>У вас нет доступа к проекту!</h1>      
  }    

  const setRole = useRoleStore(state => state.setRole);
  const userRole = useRoleStore(state => state.role);

  const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки раздела
  
  const [project, setProject] = useState(projectLoad)//тут будет объект проекта из таблицы Project для шапки раздела

  
  const navigate = useNavigate();

  const [sections, setSections] = useState(sectionLoad);

  
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // const [visibleProject, setVisibleProject] = useState(true)

  const [modalOpen, setModalOpen] = useState(false);

  const toProjects = () => {
    return navigate("/projects/");}


  useEffect(() => {
      const fetchData = async () => {
      try {
        
        //начало работы с токеном проекта
        //берем токена проекта
        // let RoleToken = await getRoleToken(project_id);
        
        //тут условие если токена не было и его запросили, а пользователь не добавлен в проект          
        // if (RoleToken === "access_denied"){
        //   setVisibleProject(false)
        // }
        
        //тут проверка уже выданного токена. Если он не принадлежит данному проекту, то запрашиваем новый                    
        // if (roleTokenVerify(project_id)) {            
        //   Cookies.remove("Project_token");
        //   const RoleToken = await getRoleToken(project_id);
        //   if (RoleToken === "access_denied"){
        //     setVisibleProject(false)
        //   }
        // }
        // const decoded = jwtDecode(roleTokenLoad);
        // setUserRole(decoded.role)
        setRole(roleTokenLoad.newRoleToken)
        console.log(roleTokenLoad.newRoleToken)
        setError("")
        setLoading(false);
      } catch (error) {
        // setError(err);
        // error.response.data.detail.error_code
        // if (error.response.data.detail.error_code === "access_denied") {
        //   setVisibleProject(false)
        // }
        setRole("")

        setLoading(false);
      }
      };

      fetchData();

    }, [roleTokenLoad.newRoleToken])

  

  
  //удаление проекта, сделать позже... пока не работает
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




      
  return (
    <div>
      {/* Боковая панель с инфой о проекте со списком разделов (постоянная) */}
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
          {
            sections?.error === "role_denied" || !Array.isArray(sections) ?
          (
          <></>
          ) : (
          <>
            {
              sections?.map(section => (
                  
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
          )          
          }
    </aside>
      
      {/* Основной контент (меняется) */}      
      <div>
        <Outlet />
      </div>
    </div>
  );
}


async function getProject(project_id) { 
  
  try {
        const responseProject = await API.get(`http://127.0.0.1:8000/project_get/${project_id}`);

        return responseProject.data

      } catch (error) {
       
        // console.log("Ошибка из detail при запросе проекта:", error.response?.data?.detail)
        // console.log("Статус ответа:", error.response?.status)       
              
        return {"error": error.response?.data?.detail}
      }
}


async function getSection(project_id) { 
  
  try {        
        
        const responseSections = await axiosRole.get(`http://127.0.0.1:8000/section_project_all/${project_id}`,
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


async function getRole(project_id) { 

  try {        
        const responseRoleToken = await API.post(`/create_project_token/`,
            {
              project_id: project_id
            }
          );

        const newRoleToken = responseRoleToken.data["project_token"];    
        Cookies.set("Project_token", newRoleToken, {
                  // expires: 0.0005, // тут указывается колво дней тут 0,72 минуты
                  expires: 30, // Кука истечет через 30 дней, тут указывается колво дней
                  path: "/", // Кука будет доступна на всех страницах        
                  sameSite: "lax", // Защита от CSRF-атак
                  });

        return {"newRoleToken": newRoleToken};
        
        
      } catch (error) {
        // setError(err);
        // error.response.data.detail.error_code
        console.error('Ошибка при получении токена роли', error.response.data.detail.message);
    
        return {"error": error.response?.data?.detail.error_code}
      }

}


const ProjectOpenLoader = async ({params}) => {
  
  const project_id = params.project_id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  // запрос проекта
  const requestProject = await getProject(project_id);  

  // запрос токена роли
  const requestRoleToken = await getRole(project_id);

  // запрос разделов проекта
  const requestSections = await getSection(project_id);  

  return {projectLoad: requestProject, sectionLoad: requestSections, roleTokenLoad: requestRoleToken}
}



export { ProjectOpenLayout, ProjectOpenLoader };