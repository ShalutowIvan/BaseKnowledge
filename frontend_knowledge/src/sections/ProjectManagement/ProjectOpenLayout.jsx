import { useState, useEffect, useRef} from 'react';
import { useParams, NavLink, useNavigate, useLoaderData, Outlet, useLocation } from 'react-router-dom'
import { SectionCreateModal } from './SectionCreateModal'
import { API } from "../../apiAxios/apiAxios"
import { axiosRole } from "./axiosRole/axiosRole"
import Cookies from "js-cookie";
import { ROLES_USERS } from "./axiosRole/RoleService"
import { useRoleStore } from './axiosRole/RoleStore';
import { ErrorDisplay } from './ErrorDisplay'
import { projectCache } from './cacheManager';
import { CollapsibleText } from './CollapsibleText';


function ProjectOpenLayout() {

  const location = useLocation();  
  const { project_id } = useParams();
  const { projectLoad, sectionLoad, roleTokenLoad } = useLoaderData();  
  const setRole = useRoleStore(state => state.setRole);
  const userRole = useRoleStore(state => state.role);

  const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки раздела  
  const [project, setProject] = useState(null);  
  const navigate = useNavigate();  
  const [sections, setSections] = useState([]);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const test = () => {
    const cachedData = projectCache.get(project_id);
    console.log("тип прожект ид:", typeof project_id)
    console.log("это сейчас в кеше:", cachedData);
  }

  
  // Флаг для предотвращения повторной загрузки при удалении
  const isDeletingSection = useRef(false);

  const toProjects = () => {
    projectCache.clear()
    return navigate("/projects/");
    }

  useEffect(() => {
    if (projectLoad) {
      if (projectLoad.error) {
        setError(projectLoad.message);
        setProject(null);
      } else {
        setProject(projectLoad);
        setError(""); // очищаем ошибку если данные валидны
      }
    }
  }, [])
  
  //эффект для загрузки jwt токена роли в состояние zustand из лоадера
  useEffect(() => {
      let isMounted = true;      

      const fetchData = async () => {
      try {        
        if (roleTokenLoad && typeof roleTokenLoad === 'object' && roleTokenLoad.error) {
          if (isMounted) setError(roleTokenLoad.error);
          return;
        } 

        if (isMounted) {
          setRole(roleTokenLoad?.newRoleToken);
          setError("");
        }
      } catch (error) {        
        if (isMounted) setRole("");        
      }      
      };
      fetchData();
    
      return () => { isMounted = false };
    }, [roleTokenLoad?.newRoleToken])

  

  // эффект загрузки секций из лоадера
  useEffect(() => {    
    let isMounted = true;
    
    const dataLoad = async () => {
      
      if (sectionLoad && typeof sectionLoad === 'object' && sectionLoad.error) {
        if (isMounted) setError(sectionLoad.error);
        return;
      } 

      if (Array.isArray(sectionLoad) && isMounted) {
        setSections(sectionLoad);
      } else if (isMounted) {
        setError("Неверный формат данных групп");
      }    

      // if (sectionLoad) {
      // if (sectionLoad.error) {
      //   setError(prev => prev ? prev : sectionLoad.message);
      //   setSections([]);
      // } else if (Array.isArray(sectionLoad)) {
      //   setSections(sectionLoad);
      // } else {
      //   setSections([]);
      //   setError("Неверный формат данных секций");
      // }
      // }

    }

    dataLoad();
    
    // Обрабатываем удаление, если есть ID в location.state
    if (location.state?.deletedSectionId) {            
      // Устанавливаем флаг удаления перед обновлением состояния
      isDeletingSection.current = true;
      setSections(prev => prev.filter(s => s.id !== location.state.deletedSectionId));
      
      // Навигация с preventScrollReset чтобы избежать перезагрузки loader
      navigate(location.pathname, { 
        replace: true, 
        state: undefined,
        // preventScrollReset: true  // ← КЛЮЧЕВАЯ СТРОКА
      });
    }
  }, [location.state, navigate]);



  // useEffect(() => {
  //   let isMounted = true;
    
  //   if (location.state?.deletedSectionId && isMounted) {      
  //     setSections(prev => prev.filter(s => s.id !== location.state.deletedSectionId));
  //     navigate(location.pathname, { replace: true, state: undefined });
  //   }
    
  //   return () => { isMounted = false };
  // }, [location.state, navigate]);


  
  
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
          //параметр project_id в params передаем для сверки принадлежности роли этому проекту. axiosRole это интерцептор axios с токеном роли
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
          console.error("Error whith save header in project:", error)
          setError(`Ошибка при сохранении шапки в проекте: ${error.message}`)        
      } finally {
        setLoading(false);
      }    
  };



const openModalClick = () => {      
    setModalOpen(true);
    };

const handleCreateSuccess = (newSection) => {  
  setSections(prevSections => [...prevSections, newSection]);
  setModalOpen(false);
  };


const usersInvite = () => {
    return navigate(`/projects/open/${project_id}/users_invite/`);}

const updateSectionInList = (updatedSection) => {
    setSections(prevSections => 
        prevSections.map(section => {
            if (section.id === updatedSection.id) {
                return {
                    ...section,
                    title: updatedSection.title,
                    description: updatedSection.description
                };
            }
            return section; // возвращаем неизмененную задачу, если ID не совпадает
        })
    );
  };

     
  return (
    <div>
      <ErrorDisplay 
          error={error} 
          onClose={() => setError(null)} 
        /> 

      {/* Боковая панель с инфой о проекте со списком разделов (постоянная) */}
      <aside>
           <button onClick={test}>test</button> 
          <p>Ваша роль: {userRole}</p>
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
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{project?.title}</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#5F9EA0' }}>Дата создания: </span>
              <br/>
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{new Date(project?.created_at).toLocaleString('ru-RU')}</span>              
              <br/>
              <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>
              <br/>              
                  <div style={{ flex: 1 }}>
                      <CollapsibleText 
                          text={project?.description}
                          maxLines={5}
                          style={{
                              fontSize: '16px',
                              color: '#E0FFFF'
                          }}
                      />
                  </div>
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
                    <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{new Date(project?.created_at).toLocaleString('ru-RU')}</span>

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
                        rows={3}
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

          {userRole === ROLES_USERS.ADMIN && <button onClick={usersInvite} className="toolbar-button">Настройки</button>}
                    
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
          <div>Для вашей роли запрещен просмотр разделов</div>
          ) : (
          <>
            {
              sections.length === 0 ? (
                <div>Нет доступных разделов</div>
              ) : (
                sections?.map(section => (
                    
                    <NavLink 
                      key={section.id}
                      to={`/projects/open/${project_id}/section_open/${section.id}`}
                      style={{ textDecoration: 'none' }}
                      preventScrollReset={true}
                    >
                      {({ isActive }) => (
                        <div className={`list-section project-section ${isActive ? "active" : ""}`}>
                          <h2 className="name-knowledge">{section.title}</h2>
                          <label>Описание: </label>
                          <div style={{ flex: 1 }}>
                              <CollapsibleText 
                                  text={section.description}
                                  maxLines={2}
                                  style={{
                                      fontSize: '20px',
                                      color: '#E0FFFF'
                                  }}
                              />
                          </div>
                          <br/><br/>
                          <button className="toolbar-button">Открыть</button>
                          
                        </div>                     
                        
                      )}
                    </NavLink>                  
                  ))
              )
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
        <Outlet context={{ updateSectionInList }} />
      </div>
    </div>
  );
}


async function getProject(project_id) { 
  
  try { 
        console.log("Запрос проекта")
        const responseProject = await axiosRole.get(`http://127.0.0.1:8000/project_get/${project_id}`,
              {
                params: {project_id: project_id}
              }
          );
        return responseProject.data
      } catch (error) {              
        console.error('Error getting role token:', error);
        const res = error.response?.data?.detail;
        if (res) {
          return {"error": res};
        } else { 
          return {"error": error.message}
        }
      }
}


async function getSection(project_id) { 
  
  try { 
        console.log("Запрос секций")
        const responseSections = await axiosRole.get(`http://127.0.0.1:8000/section_project_all/${project_id}`,
              {
                params: {project_id: project_id}
              }
          );
        return responseSections.data

      } catch (error) {       
        console.error('Error getting role token:', error);
        const res = error.response?.data?.detail;
        if (res) {
          return {"error": res};
        } else { 
          return {"error": error.message}
        }
        
      }  
}


async function getRole(project_id) { 

  try {       
        console.log("запрос токена")
        const responseRoleToken = await API.post(`/create_project_token/`,
            {
              project_id: project_id
            }
          );

        const newRoleToken = responseRoleToken.data["Project_token"];    
        Cookies.set("Project_token", newRoleToken, {
                  expires: 0.05, // тут указывается колво дней                   
                  path: "/", // Кука будет доступна на всех страницах        
                  sameSite: "lax", // Защита от CSRF-атак
                  // secure: process.env.NODE_ENV === "production" // для production
                  });

        return {"newRoleToken": newRoleToken};        
        
      } catch (error) {
        console.error('Error getting role token:', error);
        const res = error.response?.data?.detail;
        if (res) {
          return {"error": res};
        } else { 
          return {"error": error.message}
        }        
      }

}


// Вариант без кеша
// const ProjectOpenLoader = async ({request, params}) => {
   
//   const project_id = params.project_id;  
   
//   // запрос токена роли
//   const requestRoleToken = await getRole(project_id);

//   // запрос проекта
//   const requestProject = await getProject(project_id);  

//   // запрос разделов проекта
//   const requestSections = await getSection(project_id);    

//   return {
//     projectLoad: requestProject, 
//     sectionLoad: requestSections, 
//     roleTokenLoad: requestRoleToken}
// }


// вариант с простым кешем
// const ProjectOpenLoader = async ({request, params}) => {
   
//   const project_id = params.project_id;  

//   const cached = getCachedProject(project_id);
//   console.log('КЕШ', cached);
//   if (cached) {
//     console.log('📁 Используем кеш проекта', id);

//     return cached;
//   }
   
//   // запрос токена роли
//   const requestRoleToken = await getRole(project_id);

//   // запрос проекта
//   const requestProject = await getProject(project_id);  

//   // запрос разделов проекта
//   const requestSections = await getSection(project_id);


//   const result = {
//     projectLoad: requestProject,
//     sectionLoad: requestSections,
//     roleTokenLoad: requestRoleToken,
//   };

//   setCachedProject(project_id, result);

//   return result;

//   }



// Вариант с кешем дипсика.
const ProjectOpenLoader = async ({request, params}) => {
  const project_id = params.project_id;
    
  // Проверяем, есть ли данные в кеше
  const cachedData = projectCache.get(project_id);
  console.log("Текущий кеш", cachedData);
  if (cachedData) {
    console.log("Используем кешированные данные и пропускаем лоадер");
    return cachedData;
  }
  
  // Запрашиваем данные
  // const [requestRoleToken, requestProject, requestSections] = await Promise.all([
  //   getRole(project_id),
  //   getProject(project_id),
  //   getSection(project_id)
  // ]);


  // запрос токена роли
  const requestRoleToken = await getRole(project_id);

  // запрос проекта
  const requestProject = await getProject(project_id);  

  // запрос разделов проекта
  const requestSections = await getSection(project_id);  

  const result = {
    projectLoad: requestProject, 
    sectionLoad: requestSections, 
    roleTokenLoad: requestRoleToken
  };
    
  projectCache.set(project_id, result);  
  const cachedDataA = projectCache.get(project_id);
  console.log("КЕШ после установки", cachedDataA);
  
  return result;
}



export { ProjectOpenLayout, ProjectOpenLoader };
