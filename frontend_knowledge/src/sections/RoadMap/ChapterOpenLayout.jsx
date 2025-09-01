import { useState, useEffect, useCallback } from 'react';

import axios from 'axios';
import { NavLink, useNavigate, useParams, useLoaderData, useRevalidator, Outlet, useLocation } from 'react-router-dom'

// import { json } from 'react-router-dom/static';
// import { json } from "react-router-dom"
// import { json } from "react-router-dom/server";
import { API } from "../../apiAxios/apiAxios"


// import { json } from "./jsonUtils/jsonUtils";

import { StageCreateModal } from './StageCreateModal'


function ChapterOpen() {

    const location = useLocation();
    
    const { stagesLoad, chapterLoad } = useLoaderData();//лоадер содержания проекта, грузим разделы и таски
    const { chapter_id, roadmap_id } = useParams();
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки проекта    
    
    const [chapter, setChapter] = useState(null)
    
    const [stages, setStages] = useState([]);

    // состояние для отслеживания активного этапа
    const [activeStageId, setActiveStageId] = useState(null);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // редактирование шапок!!!!!!!!!!!!!!!!!!!! начало
        
    const validateFormArray = (stageId) => {
        const foundItemForm = stages.find(item => item.id === stageId);
        console.log("ID", foundItemForm)
        // Проверяем, найден ли элемент
        if (!foundItemForm) {
            setError("Элемент не найден!");
            return false;
        }
        
        // Проверяем поля на пустоту (включая пустые строки)
        if (!foundItemForm?.title?.trim() || !foundItemForm?.description?.trim()) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        
        setError('');
        return true;
    }
    

    //функция для формы
    const saveHeaderStage = async (stageId, title, description, state, event) => {
          event.preventDefault();

          if (!validateFormArray(stageId)) return;
          try {           
              setLoading(true);
              const response = await API.patch(
                  `/stage_update_header/${stageId}`,
                  { title: title, description: description, state: state}
                  
                  );
              setEditModeHeader(false)
              setError("")
              if (response.statusText==='OK') {                  
                  setStages(prev => prev.map(item => 
                      item.id === stageId ? { ...item, updated_at: response.data.updated_at, isEditing: false } : item
                    ));
                  console.log("Update complete!")                
              } else {
                  const errorData = await response.data
                  console.log(errorData, 'тут ошибка')
              }
          } catch (error) {            
              console.log("Ошибка из бэка", error)
              setError('что-то пошло не так');            
          } finally {
            setLoading(false);
          }    
      };

    const STAGE_STATES = {
        NOT_STUDIED: 'not_studied',
        IN_THE_STUDY: 'in_the_study',
        COMPLETED: 'completed'
      };

    // функция для изменения состояний при редактировании формы в списке этапов, работает на каждый этап отдельно
    const setHeaderStage = useCallback((stage_id) => (e) => {
      const { name, value } = e.target;
      setStages(prev => prev.map(item => 
        item.id === stage_id ? { ...item, [name]: value } : item
      ));
    }, []);


    const navigate = useNavigate();    

    if (stagesLoad?.error) {      
      return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {stagesLoad["error"]}. Пройдите авторизацию.</h1>
    }
     
    const editStage = (stageId) => {
      setStages(prevStages => 
        prevStages.map(item => (
          item.id === stageId ?
          { ...item, isEditing: true} 
          : item
          )));      
    }

    const cancelEditStage = (stageId) => {
      const foundStageLoad = stagesLoad.find(item => item.id === stageId);
      setStages(prevStages => 
        prevStages.map(item => (
          item.id === stageId ?
          { ...item, isEditing: false, title: foundStageLoad.title, description: foundStageLoad.description, state: foundStageLoad.state} 
          : item
          )));      
    }

  
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setActiveStageId(null);//сброс активного этапа с выделением

                if (chapterLoad && !chapterLoad.error) {
                    setChapter(chapterLoad);
                }                

                if (stagesLoad && !stagesLoad.error) {
                    // Убедимся, что stagesLoad - массив
                    const stagesArray = Array.isArray(stagesLoad) ? stagesLoad : [];
                    setStages(prevItems => 
                        stagesArray.map(item => ({
                          ...item,                        
                          isEditing: false
                        })));
                    }

                if (location.state?.deletedStageId) {                
                setStages(prev => prev.filter(st => st.id !== location.state.deletedStageId));
                navigate(location.pathname, { replace: true, state: undefined });//это очистка локального состояния контекста location
                }                

            } catch (err) {
                setError(`Ошибка загрузки данных: ${err.error}`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [chapter_id, location.state]);


    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const activeStageFromUrl = searchParams.get('activeStage');
        
        if (activeStageFromUrl) {
            setActiveStageId(activeStageFromUrl);
        }
    }, [location.search]);
    
    
    const goBack = () => {      
      return navigate(`/roadmaps/open/${roadmap_id}`);}
    
    //удаление секции
    const deleteChapter = async () => {
      if (window.confirm('Вы уверены, что хотите удалить?')) {
        try {
          await API.delete(`/delete_chapter/${chapter_id}`);
          // Возвращаемся к списку разделов
          navigate(`/roadmaps/open/${roadmap_id}`, {
            state: { deletedChapterId: chapter_id }, // Передаем ID удаленной секции
            replace: true // Важно: заменяем текущую запись в истории
          });

          // navigate(`/projects/open/${project_id}?skipRefresh=true`, { 
          //   replace: true
          // });

        } catch (error) {
          console.error('Ошибка при удалении:', error);
        }
      }
    };

  const validateForm = () => {
        if (!chapter.title || !chapter.description ) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

  const handleHeaderChangeS = (e) => {
    const { name, value } = e.target;
    setChapter(prev => ({
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
                `/chapter_update_header/${chapter_id}`,
                { title: chapter.title, description: chapter.description });            
            setError("")
            if (response.statusText==='OK') {
                setEditModeHeader(false)

                console.log("Update complete!")                
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')
            }
        } catch (error) {            
            console.log(error)
            setError(error)
        } finally {
          setLoading(false);
        }    
    };

      
  const [modalOpen, setModalOpen] = useState(false);
  
  const openModalClick = () => {	    
        setModalOpen(true);
        };
  
  const handleCreateSuccess = (newStage) => {            
      setStages(prevStages => [...prevStages, newStage]);
      setModalOpen(false);
      };


  if (loading || !chapter) {
      return <div>Загрузка...</div>;
  }    

  const goChapterList = () => {
      return navigate(`/roadmaps/open/${roadmap_id}`);
    }
 
  // обработчик клика по этапу
  // const handleOpenClick = (stageId, e) => {
  //   e.stopPropagation(); // Останавливаем всплытие
  //   setActiveStageId(stageId);

  //   navigate(`?activeStage=${stageId}`, { replace: true });
  // };

  const handleOpenClick = (stageId, e) => {
        e.stopPropagation();
        setActiveStageId(stageId);
        
        // Добавляем параметр в URL без перезагрузки страницы
        navigate(`${location.pathname}?activeStage=${stageId}`, { 
            replace: true,
            state: location.state // Сохраняем существующее состояние
        });
    };

      
  return (
    <div className='container-roadmap-view'>    
      
    <div className='chapter-section'>
      <div className="stages-section">        
        {/*функция для тестов*/}
        {/*<button onClick={test}>test</button>*/}

        {/*это шапка раздела*/}  
        {/*начало шапки*/}
        {/*если не редачим шапку отображаются поля шапки*/}
        {!editModeHeader ? (
          <>          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
            <span style={{ fontSize: '15px', color: '#5F9EA0', fontWeight: 'bold' }}>Название раздела:</span>
            &nbsp;&nbsp;
            <span style={{ fontSize: '15px', color: '#E0FFFF' }}>{chapter.title}</span>
            </div>
            
            <button onClick={() => setEditModeHeader(true)} className="change-button"></button>
          </div>

          <div>
            <span style={{ fontSize: '15px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>
            &nbsp;&nbsp;
            <span style={{ fontSize: '15px', color: '#E0FFFF' }}>{chapter.description}</span>
          </div>

          <div>
            <span style={{ fontSize: '15px', color: '#5F9EA0', fontWeight: 'bold' }}>Дата создания:</span>
            &nbsp;&nbsp;
            <span style={{ fontSize: '15px', color: '#E0FFFF' }}>{chapter.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            
            
            
            
          </div>
          </>
          ) : (
          <>
          {/*отображаются поля формы если редактируем шапку*/}
          {/*начало формы*/}
          
          <form onSubmit={saveHeaderChanges} style={{ marginBottom: '1rem' }}>

                {/*первая строка */}
                {/*<div>*/}
                  <span style={{ fontSize: '15px', color: '#5F9EA0', fontWeight: 'bold' }}>Название раздела:</span>
                  &nbsp;&nbsp;
                  <input 
                        placeholder="введите назвнаие"
                        name="title"
                        type="text"
                        value={chapter.title}                        
                        onChange={handleHeaderChangeS}
                        disabled={loading}
                    /> 
                {/*</div>*/}

                {/*вторая строка с формой названия секции*/}
                
                <br/>

                {/*третья строка с чекбоксом*/}
                {/*<div>*/}                  
                  <span style={{ fontSize: '15px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>

                  &nbsp;&nbsp;
                  <textarea
                    placeholder="введите описание"
                    name="description"
                    value={chapter.description}
                    onChange={handleHeaderChangeS}
                    disabled={loading}
                    rows={2}
                  />
                                    
                {/*</div>*/}


                {/*четвертая строка с формой описания секции*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                
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
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <button onClick={goChapterList} className="toolbar-button">Закрыть</button>
          <button className="cancel-button" onClick={deleteChapter}>Удалить главу</button>
          </div>
          
          
          
          <h2>Этапы изучения в разделе</h2>
          
          
          
          
          <button className="save-button" onClick={openModalClick}>Добавить этап</button>

          {modalOpen && (
		        <StageCreateModal
		          chapter_id={chapter_id}              
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleCreateSuccess}
		        />
		      )}
			      
        <br/><br/>
        
          {
                  stages.length === 0 ? (
                    <div className="name-knowledge">В этой главе пока нет этапов.</div>
                  ) : (stages?.map(stage => (
    // Для каждого этапа рендерим либо NavLink, либо форму редактирования
    stage.isEditing ? (
      // ФОРМА РЕДАКТИРОВАНИЯ (ВНЕ NavLink)
      <div className="list-stage project-section" key={`edit-${stage.id}`}>
        <form onSubmit={(e) => saveHeaderStage(stage.id, stage.title, stage.description, stage.state, e)} style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Название: </span>
          <input 
            placeholder="введите название"
            name="title"
            type="text"                        
            value={stage.title}
            onChange={setHeaderStage(stage.id)}
            disabled={loading}
          />                
          
          <br/><br/>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Описание: </span>
          <textarea
            placeholder="введите описание"
            name="description"
            value={stage.description}
            onChange={setHeaderStage(stage.id)}
            disabled={loading}
            rows={2}
          />

          <br/><br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Статус: </span>
            {/*&nbsp;&nbsp;  */}
            <select name="state" value={stage.state} onChange={setHeaderStage(stage.id)}>
              <option value={STAGE_STATES.NOT_STUDIED}>Не изучено</option>
              <option value={STAGE_STATES.IN_THE_STUDY}>В процессе изучения</option>
              <option value={STAGE_STATES.COMPLETED}>Завершена</option>
            </select>
            </div>

            <div>
              <button 
                className="accept-button" 
                type="submit" 
                disabled={loading}
              >
                {loading ? '...' : ' '}
              </button>
              &nbsp;&nbsp;                                  

              <button 
                onClick={(e) => { 
                  e.preventDefault();
                  cancelEditStage(stage.id); 
                }}
                className="close-button"
                disabled={loading}
              >                
              </button>
            </div>
          </div>
          {error && <p style={{ color: 'red'}}>{error}</p>}
        </form>
      </div>
    ) : (
      // ОБЫЧНЫЙ РЕЖИМ (ВНУТРИ NavLink)
      <NavLink 
        key={stage.id}
        to={`/roadmaps/open/${chapter.roadmap_id}/chapter_open/${chapter_id}/stage_open/${stage.id}`}
        style={{ textDecoration: 'none' }}
      >
        {({ isActive }) => (
          <div className={`list-stage project-section ${isActive ? "active" : ""}`}>
            <div className="name-knowledge" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>                            
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Название: {stage.title}</span>
              <div>
                <button 
                  className="change-button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editStage(stage.id);
                  }}
                ></button>
                &nbsp;&nbsp;&nbsp;&nbsp;
              </div>
            </div>                          
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Описание: {stage.description}</span>
            <br/>
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Статус: </span>
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
              {stage.state === STAGE_STATES.NOT_STUDIED && 'Не изучено'}
              {stage.state === STAGE_STATES.IN_THE_STUDY && 'В процессе изучения'}
              {stage.state === STAGE_STATES.COMPLETED && 'Завершена'}
            </span>
            <br/>
            <button className="toolbar-button">Открыть</button>
          </div>
        )}
      </NavLink>
    )
  )))
}

    </div>     
    
    }      
    

      <div>
        <Outlet />
      </div>

    </div>

    )
}


async function getChapter(chapter_id) { 
  
  try {        
        const responseChapter = await API.get(`/chapter_get/${chapter_id}`);
        return responseChapter.data
      } catch (error) {
        return {"error": error.response?.data?.detail}
      }  
}


async function getStages(chapter_id) { 
  
  try {        
        const responseStages = await API.get(`/stage_chapter_all/${chapter_id}`);
        return responseStages.data
      } catch (error) {
        return {"error": error.response?.data?.detail}
      }  
}




const ChapterOpenLoader = async ({params}) => {
  
  const chapter_id = params.chapter_id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  const requestChapter = await getChapter(chapter_id)

  const requestStages = await getStages(chapter_id)  

  return {
    stagesLoad: requestStages,
    chapterLoad: requestChapter
  }
}



export { ChapterOpen, ChapterOpenLoader };