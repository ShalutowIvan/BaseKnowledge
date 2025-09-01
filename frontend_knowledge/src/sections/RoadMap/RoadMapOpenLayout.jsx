import { useState, useEffect, useRef } from 'react';
import { useParams, Link, NavLink, useNavigate, useLoaderData, Await, redirect, useRevalidator, Outlet, useLocation } from 'react-router-dom'
import { ChapterCreateModal } from './ChapterCreateModal'
import { API } from "../../apiAxios/apiAxios"

import Cookies from "js-cookie";

import { jwtDecode } from 'jwt-decode';

//тут компонент отрисовывается при открытии проекта с Outlet в середине, который будет меняться при открытии разделов, при открытии раздела можно сразу открыть задачу и она тоже будет как outlet. 

function RoadMapOpenLayout() {
  
  const location = useLocation();
  
  const { roadmap_id } = useParams();

  const { roadmapLoad, chaptersLoad } = useLoaderData();
  
  //проверка есть ли ошибка авторизации
  if (roadmapLoad?.error) {  
    return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {roadmapLoad["error"]}. Пройдите авторизацию.</h1>
    }

  // if (sectionLoad.error) {
  //   return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {sectionLoad.error}. Роль не соответсвует.</h1>
  //   }
  

  const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки раздела
  
  const [roadmap, setRoadmap] = useState(roadmapLoad)
  
  const navigate = useNavigate();

  
  const [chapters, setChapters] = useState([]);

  // пробую zustand вместо обычного useState
  // const { sections, setSections, removeSection, addSection } = useSectionsStore();

  
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // const [visibleProject, setVisibleProject] = useState(true)

  const [modalOpen, setModalOpen] = useState(false);

  const toRoadmaps = () => {
    return navigate("/roadmaps/");}

  
    
  // эффект с состоянием секции
  useEffect(() => {
    // Инициализируем секции из loader
    if (chaptersLoad && !chaptersLoad.error) {
      setChapters(chaptersLoad);
    }
    
    // Обрабатываем удаление, если есть ID в location.state. Переделать удаление. Кнопка удаления в открытой секции
    if (location.state?.deletedChapterId) {
      console.log("состояние локейшн", location.state?.deletedChapterId)
      setChapters(prev => prev.filter(ch => ch.id !== location.state.deletedChapterId));

      navigate(location.pathname, { replace: true, state: undefined });//это очистка локального состояния контекста location
    }
  }, [chaptersLoad, location.state]);


  
    
const validateForm = () => {
      if (!roadmap.title || !roadmap.description ) {
          setError("Есть пустые поля, заполните, пожалуйста!");
          return false;
      }
      setError('');
      return true;
  }

const handleHeaderChange = (e) => {
  const { name, value } = e.target;
  setRoadmap(prev => ({
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
          
          const response = await API.patch(
              `/roadmap_update_header/${roadmap_id}`,                 
              { title: roadmap.title, description: roadmap.description }
              );
          setEditModeHeader(false)
          setError("")
          if (response.statusText==='OK') {               
              console.log("Update complete!")                
          } else {
              const errorData = await response.data
              console.log('тут ошибка при сохранении шапки', errorData)
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

const handleCreateSuccess = (newChapter) => {  
  setChapters(prevChapters => [...prevChapters, newChapter]);
  setModalOpen(false);
  };

  const settingsOpen = () => {
    return navigate(`/roadmaps/open/${roadmap_id}/settings/`);}

      
  return (
    <div>
      {/* Боковая панель с инфой о проекте со списком разделов (постоянная) */}
      <aside>
          
          <br/><br/>
          <button onClick={toRoadmaps} className="toolbar-button">К списку дорожных карт</button>
          <br/><br/>

          {/* шапка проекта */}
          <div>
          <div className="project-section header-project">
            {/*это шапка мапы*/}  
            {/*начало шапки*/}
            {/*если не редачим шапку отображаются поля шапки*/}
            {!editModeHeader ? (
              <>          
              <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Название мапы:</span>
              <br/>  
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{roadmap?.title}</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#5F9EA0' }}>Дата создания: </span>
              <br/>
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{roadmap?.created_at}</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>
              <br/>
              <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{roadmap?.description}</span>
              <br/><br/>
              
              <button onClick={() => setEditModeHeader(true)} className="change-button">
                    
              </button>
                            
              </>
              ) : (
              <>
              {/*отображаются поля формы если редактируем шапку*/}
              {/*начало формы*/}
              
              <form onSubmit={saveHeaderChanges} style={{ marginBottom: '1rem' }}>

                    {/*первая строка без формы*/}
                    
                    <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Название мапы:</span>
                    <br/>
                    {/*вторая строка с формой названия проекта*/}                    
                        <input 
                            placeholder="введите назвнаие"
                            name="title"
                            type="text"
                            value={roadmap.title}                        
                            onChange={handleHeaderChange}
                            disabled={loading}
                        />                
                        
                    
                    <br/>

                    <span style={{ fontSize: '16px', color: '#5F9EA0' }}>Дата создания: </span>
                    <br/>
                    <span style={{ fontSize: '16px', color: '#E0FFFF' }}>{roadmap.created_at}</span>

                    {/*третья строка */}
                    <br/>
                    <span style={{ fontSize: '16px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
                    <br/>
                    

                    {/*четвертая строка с формой описания проекта*/}
                      <textarea
                        placeholder="введите описание"
                        name="description"
                        value={roadmap.description}
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

          <button onClick={settingsOpen} className="toolbar-button">Настройки</button>

          <p>_________________________________</p>
          <h1>Разделы дорожной карты</h1> 
          
          <button className="save-button" onClick={openModalClick}>Добавить главу</button>
          
              
        <br/><br/>
          
          
            {
              chapters.length === 0 ? (
                <div>Нет доступных глав</div>
              ) : (
                chapters?.map(chapter => (
                    
                    <NavLink 
                      key={chapter.id}
                      to={`/roadmaps/open/${roadmap_id}/chapter_open/${chapter.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      {({ isActive }) => (
                        <div className={`list-section project-section ${isActive ? "active" : ""}`}>
                          <h2 className="name-knowledge">{chapter.title}</h2>
                          <label>Описание: {chapter.description}</label>
                          <br/><br/>
                          <button className="toolbar-button">Открыть</button>
                          
                        </div>                        
                      )}
                      
                    </NavLink>                  
                  ))
              )
            }

          {modalOpen && (
            <ChapterCreateModal
              roadmap_id={roadmap_id}
              onClose={() => setModalOpen(false)}
              onSuccess={handleCreateSuccess}
            />
          )}
          
                   
          
    </aside>
      
      {/* Основной контент (меняется) */}      
      <div>
        <Outlet />
      </div>
    </div>
  );
}


async function getRoadMap(roadmap_id) { 
  
  try {
        console.log("Сработал запрос мапы")
        const responseRoadMap = await API.get(`http://127.0.0.1:8000/roadmap_get/${roadmap_id}`
          );


        return responseRoadMap.data

      } catch (error) {
       
        // console.log("Ошибка из detail при запросе проекта:", error.response?.data?.detail)
        // console.log("Статус ответа:", error.response?.status)       
              
        return {"error": error.response?.data?.detail}
      }
}


async function getChapters(roadmap_id) { 
  
  try {        
        console.log("Сработал запрос глав")
        const responseChapters = await API.get(`http://127.0.0.1:8000/chapters_roadmap_all/${roadmap_id}`);

        return responseChapters.data

      } catch (error) {
       
        // console.log("Ошибка из detail при запросе секций:", error.response?.data?.detail)
        // console.log("Статус ответа:", error.response?.status)       

        return {"error": error.response?.data?.detail.error_code}
      }  
}


const RoadMapOpenLoader = async ({params}) => {
  
  const roadmap_id = params.roadmap_id
    
  // запрос мапы
  const requestRoadMap = await getRoadMap(roadmap_id);  

  // запрос разделов мапы
  const requestChapters = await getChapters(roadmap_id);  

  return {
    roadmapLoad: requestRoadMap, 
    chaptersLoad: requestChapters 
    }
}



export { RoadMapOpenLayout, RoadMapOpenLoader };


