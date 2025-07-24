import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, useNavigate, useLoaderData, Await, redirect, useRevalidator } from 'react-router-dom'

// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
// import MDEditor from 'mdeditor';//это по совету гугла

import 'highlight.js/styles/atom-one-dark.css'; // стили подсветки (можно выбрать любой другой)

import { markdownPlugins, markdownComponents } from './MDutils/UtilsImageMD';
import { TextStyleToolbar } from './MDutils/TextStyleToolbar';

import { useRoleStore } from './axiosRole/RoleStore';
import { ROLES_USERS } from "./axiosRole/RoleService"


function TaskOpen() {
    const revalidator = useRevalidator();

    const userRole = useRoleStore(state => state.role);

    const [section, setSection] = useState({})

    const { taskLoad } = useLoaderData();
    const [editMode, setEditMode] = useState(false);//это для редактирования контента
    const [preview, setPreview] = useState(false);//предварительный просмотр при редактировании контента
    
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки

    // const {slug} = useParams();
    const [task, setTask] = useState(taskLoad);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

        
    // Обработчик изменений для MDEditor. Это пока убрали, так как у МД есть свой проп onChange
    const handleTextChange = (value) => {
      setTask({ ...task, content: value || '' });
    };

        
    // сохранение после редактирования
    const handleSave = async () => {
    try {
      //тут идет отправка текста на сервер.
      setLoading(true);
      await axios.put(`http://127.0.0.1:8000/task_update/${task.id}`, {            
            content: task.content
          });      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving knowledge: ', error);
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
    };

    useEffect(() => {
            fetch(`http://127.0.0.1:8000/section_get/${task.section_id}`)
                .then(res => res.json())
                .then(data => setSection(data));
        }, [])

    const navigate = useNavigate();

    const goTaskList = () => {
      return navigate(`/projects/open/${section.project_id}/section_open/${task.section_id}`);
    }

      
  const deleteTask = () => {
    if (window.confirm('Вы уверены, что хотите удалить?')) {
      // Действие при подтверждении
      axios.delete(`http://127.0.0.1:8000/delete_task/${task.id}`)      
      navigate(`/projects/open/${section.project_id}/section_open/${section.id}`);
      revalidator.revalidate();//принудительная перезагрузка лоадера после редиректа в списке знаний
    }  
  };


  // Обработчики изменений для полей шапки. Тут в зависимости от имени поля в input поле в jsx вставится значение из этого поля в нужное поле
  const handleHeaderChangeT = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
        if (!task.title || !task.description ) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

  //функция для формы
  const saveHeaderChanges = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        try {           
            setLoading(true);
            const response = await axios.patch(
                `http://127.0.0.1:8000/task_update_header/${task.id}`,
                {                 
                  title: task.title,
                  description: task.description,
                }                
                );
            setEditModeHeader(false)
            setError("")
            if (response.statusText==='OK') {
                setTask({ ...task, updated_at: response.data.updated_at});                
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


  // статус задачи
  const [selectedState, setSelectedState] = useState('new');
  const [modifyState, setModifyState ] = useState(false)

  const TASK_STATES = {
      NEW: 'new',
      AT_WORK: 'at_work',
      COMPLETED: 'completed'
    };

  const handleChangeState = (event) => {
    setSelectedState(event.target.value);
  };

  const saveState = async (event) => {
    event.preventDefault();
    try {           
          setLoading(true);
          console.log("состояние тут", selectedState)
          const response = await axios.patch(
                `http://127.0.0.1:8000/task_state_change/${task.id}`,
                {                 
                  state: selectedState
                }                
                );
            setModifyState(false)
            setError("")
            if (response.statusText==='OK') {                
                setTask({ 
                  ...task, 
                  state: response.data.state,
                  updated_at: response.data.updated_at
                });
                console.log("Update complete!")                
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')
            }
        } catch (error) {            
            if (error.response) {
              // Сервер ответил с ошибкой 4xx/5xx
              setError(error.response.data?.detail || error.message);
            } else {
              setError('Network error');
            }
        } finally {
          setLoading(false);
        }    
  }


        
  return (
    <>
            
      <div className="post-container">
        <div className='header-section'>
        {/*это шапка таски*/}        
        
        {/*начало шапки*/}
        {/*если не редачим шапку отображаются поля шапки*/}
        {!editModeHeader ? (
          <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {task.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{task.title}</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {task.updated_at}</span>
          </div>
          <br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>            
              
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{task.description}</span>
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
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
                  <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {task.created_at}</span>
                </div>

                {/*вторая строка с формой названия*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input 
                        placeholder="введите назвнаие"
                        name="title"
                        type="text"                        
                        value={task.title}
                        onChange={handleHeaderChangeT}
                        disabled={loading}
                    />                
                    <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {task.updated_at}</span>
                </div>
                <br/>

                {/*третья строка с чекбоксом*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>
                </div>

                {/*четвертая строка с формой описания знания*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <textarea
                    placeholder="введите описание"
                    name="description"
                    value={task.description}
                    onChange={handleHeaderChangeT}
                    disabled={loading}
                    rows={2}
                  />
                
                  <div>
                  <button className="save-button" type="submit" disabled={loading}>                    
                    {loading ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  &nbsp;&nbsp;
                  <button 
                    onClick={() => {setTask(taskLoadLoad); setEditModeHeader(false);}}
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
    {/*ниже редактор контента знания*/}
    {/* <div className="post-container"> */}
      <button onClick={goTaskList} className="toolbar-button">К списку задач раздела</button>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>Содержание задачи</h1>
                             
          <div>
          {!modifyState ? (
            <>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Статус: </span>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
             {task.state === TASK_STATES.NEW && 'Новая'}
             {task.state === TASK_STATES.AT_WORK && 'В работе'}
             {task.state === TASK_STATES.COMPLETED && 'Завершена'}
            </span>
            
            {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
            <button onClick={() => {setModifyState(true);}} className="change-button"></button>}

            </>
          ) : (
          <>
          <select value={selectedState} onChange={handleChangeState}>
            <option value={TASK_STATES.NEW}>Новая</option>
            <option value={TASK_STATES.AT_WORK}>В работе</option>
            <option value={TASK_STATES.COMPLETED}>Завершена</option>
          </select>
          <button onClick={saveState} className="accept-button"></button>
          </>
          )
          }          
          </div>
                   
      </div>
      
      
      {editMode ? (

        <div className="editor-section">
          <h3>Редактор задачи</h3>
          <div className="editor-toolbar">
            <button type="button" className="toolbar-button" onClick={() => setPreview(!preview)}>
              {preview ? 'Редактировать' : 'Предварительный просмотр'}
            </button>
                                    
          </div>

           

            {/*предпросмотр получившегося маркдаун*/}
           {preview ? (
            <div className="markdown-content">
              <ReactMarkdown 
              remarkPlugins={markdownPlugins.remark}
              rehypePlugins={markdownPlugins.rehype}
              components={markdownComponents}
              >
                {task.content}
              </ReactMarkdown>
            </div>
          ) : (
            
            <>
            {/* размер и стили шрифта */}
            <TextStyleToolbar onApplyStyle={(openTag, closeTag = openTag) => {
              const textarea = document.querySelector('.w-md-editor-text-input'); // получаем textarea MDEditor
              if (!textarea) return;

              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selected = textarea.value.slice(start, end);
              const before = textarea.value.slice(0, start);
              const after = textarea.value.slice(end);

              const newText = `${before}${openTag}${selected}${closeTag}${after}`;

              setTask(prev => ({ ...prev, content: newText }));
            }} />
            
            <MDEditor              
              value={task.content}
              onChange={handleTextChange}
              height={500}
              preview="edit"            
            />

            </>
          )}


          <div className="editor-actions">
            {/*кнопка сохранить*/}
            <button 
                onClick={handleSave} 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>

            {/*кнопка отменить*/}
            <button onClick={() => {
                setTask(task);
                setEditMode(false);
              }}
              className="cancel-button"
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        
        // отображение сохраненного контента
        <div className="view-mode">
          <div className="markdown-content" data-color-mode="light">
              <ReactMarkdown
                remarkPlugins={markdownPlugins.remark}
                rehypePlugins={markdownPlugins.rehype}
                components={markdownComponents}
                >
                {task.content}
              </ReactMarkdown>
            </div>
            <br/>
            {task.state !== TASK_STATES.COMPLETED && 
            <>
            {
              (userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
              <button onClick={() => setEditMode(true)} className="toolbar-button">
                Редактировать задачу
              </button>
            }
            
            {
              (userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
              <button onClick={deleteTask} className="delete-button">Удалить задачу</button>
            }
            </>
            }            

        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
                    
                    
    </>
    )
}


async function getTaskOpen(task_id) { 
  const res = await fetch(`http://127.0.0.1:8000/task_open/${task_id}`)//тут берутся все элементы с одним и тем же номером документа

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


const TaskOpenLoader = async ({params}) => {
  
  const task_id = params.task_id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  return {taskLoad: await getTaskOpen(task_id)}
}



export { TaskOpen, TaskOpenLoader };