import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import { useParams, Link, useNavigate, useLoaderData, Await, redirect, useRevalidator, useOutletContext } from 'react-router-dom'

// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
// import MDEditor from 'mdeditor';//это по совету гугла

import 'highlight.js/styles/atom-one-dark.css'; // стили подсветки (можно выбрать любой другой)

import { markdownPlugins, markdownComponents } from './MDutils/UtilsImageMD';
import { TextStyleToolbar } from './MDutils/TextStyleToolbar';

import { useRoleStore } from './axiosRole/RoleStore';
import { ROLES_USERS } from "./axiosRole/RoleService"
import { axiosRole } from "./axiosRole/axiosRole"
import { CollapsibleText } from './CollapsibleText';
import { FaCheck, FaTimes } from 'react-icons/fa';
import './CSS/cssProjects.css';



function TaskOpen() {
    
    const { updateTaskInList, deleteTaskInList } = useOutletContext();

    const userRole = useRoleStore(state => state.role);
    const { taskLoad } = useLoaderData();   

    if (taskLoad.error === "role_denied") {
      return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>У вас нет доступа к проекту!</h1>  
    }
    const [editMode, setEditMode] = useState(false);//это для редактирования контента
    const [preview, setPreview] = useState(false);//предварительный просмотр при редактировании контента
    
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки

    const { project_id, section_id, task_id } = useParams();

    const [task, setTask] = useState(taskLoad);
    const [originalStatus, setOriginalStatus] = useState(undefined);
    
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
        await axiosRole.put(`http://127.0.0.1:8000/task_update/${project_id}/${task.id}`, 
            { content: task.content },
            {
              params: {project_id: project_id}
            }
            );      
        setEditMode(false);
      } catch (error) {
        console.error('Error saving task: ', error);
        setError(error.error_code || error || 'Failed to save changes');
      } finally {
        setLoading(false);
      }
      };

    useEffect(() => {
      const fetchData = async () => {
          try {
              setLoading(true);                
              if (taskLoad && !taskLoad.error) {
                  setTask(taskLoad);
              }                

          } catch (err) {
              setError(`Ошибка загрузки данных: ${err.error}`);
          } finally {
              setLoading(false);
          }
      };
        
        fetchData();
    }, [task_id]);

    const navigate = useNavigate();

    const goTaskList = () => {
      return navigate(`/projects/open/${project_id}/section_open/${section_id}`);
    }

      
  const deleteTask = () => {
    if (window.confirm('Вы уверены, что хотите удалить?')) {
      try {
      // Действие при подтверждении
      axiosRole.delete(`http://127.0.0.1:8000/delete_task/${project_id}/${task.id}`,
        { params: {project_id: project_id} }
        )
      navigate(`/projects/open/${project_id}/section_open/${section_id}`);
      deleteTaskInList(task.id);      
      } catch (error) {
        console.error('Error whith delete task:', error);
        setError(`Ошибка при удалении задачи: ${error.message}`)
      }
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
            const response = await axiosRole.patch(
                `http://127.0.0.1:8000/task_update_header/${project_id}/${task.id}`,
                { title: task.title, description: task.description,},
                { params: {project_id: project_id} }
                );
            setEditModeHeader(false)
            setError("")
            if (response.statusText==='OK') {
                setTask({ ...task, updated_at: response.data.updated_at});
                const updatedTask = { 
                    ...task, 
                    title: task.title,
                    description: task.description,
                    updated_at: response.data.updated_at
                };
                updateTaskInList(updatedTask);
                console.log("Update complete!")                
            } 
            // else {
            //     const errorData = await response.data
            //     console.log(errorData, 'тут ошибка')
            // }
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
          const response = await axiosRole.patch(
                `http://127.0.0.1:8000/task_state_change/${project_id}/${task.id}`,
                { state: selectedState },
                { params: {project_id: project_id} }
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

  const cancelEditStatus = (taskId) => {
        setTask(prev => 
            prev.map(item => (
              item.id === userId ? { 
                ...item, 
                modifyRole: false,
                role: item.originalRole, // возвращаем исходное значение
                originalRole: undefined // очищаем временное значение
              } : item
            )));
    };

  return (
    <div className="task-main-container">
      <div className="task-content-wrapper">
        {/* Шапка задачи */}
        <div className='header-section task-header-section'>
          {!editModeHeader ? (
            <>
              <div className="task-header-row">
                <span className="task-header-label">Название:</span>
                <span className="task-header-date">Дата создания: {new Date(task.created_at).toLocaleString('ru-RU')}</span>
              </div>

              <div className="task-header-row">
                <span className="task-header-value">{task.title}</span>
                <span className="task-header-date">Дата изменения: {new Date(task.updated_at).toLocaleString('ru-RU')}</span>
              </div>
              
              <br/>
              
              <div className="task-header-row">
                <span className="task-header-label">Описание:</span>
              </div>

              <div className="task-header-row task-description-row">
                <div className="task-description-content">
                  <CollapsibleText 
                    text={task.description}
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
            <form onSubmit={saveHeaderChanges} className="task-header-form">
              <div className="task-header-row">
                <span className="task-header-label">Название:</span>
                <span className="task-header-date">Дата создания: {new Date(task.created_at).toLocaleString('ru-RU')}</span>
              </div>

              <div className="task-header-row">
                <input 
                  placeholder="введите название"
                  name="title"
                  type="text"                        
                  value={task.title}
                  onChange={handleHeaderChangeT}
                  disabled={loading}
                  className="task-header-input"
                />
                <span className="task-header-date">Дата изменения: {new Date(task.updated_at).toLocaleString('ru-RU')}</span>
              </div>
              
              <br/>

              <div className="task-header-row">
                <span className="task-header-label">Описание:</span>
              </div>

              <div className="task-header-row task-description-edit-row">
                <textarea
                  placeholder="введите описание"
                  name="description"
                  value={task.description}
                  onChange={handleHeaderChangeT}
                  disabled={loading}
                  rows={2}
                  className="task-header-textarea"
                />
                
                <div className="task-header-buttons">
                  <button className="save-button" type="submit" disabled={loading}>
                    {loading ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={() => {setTask(taskLoad); setEditModeHeader(false);}}
                    className="cancel-button"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                </div>
              </div>
              
              {error && <p className="error-text">{error}</p>}
            </form>
          )}
        </div>

        {/* Основной контент задачи */}
        <div className="task-body-section">
          {/* Панель управления */}
          <div className="task-controls-panel">
            <button onClick={goTaskList} className="toolbar-button">Закрыть</button>
            
            <div className="task-status-section">
              <h1>Содержание задачи</h1>
              
              <div className="task-status-controls">
                {!modifyState ? (
                  <div className="task-status-display">
                    <span className="task-status-label">Статус: </span>
                    <span className="task-status-value">
                      {task.state === TASK_STATES.NEW && 'Новая'}
                      {task.state === TASK_STATES.AT_WORK && 'В работе'}
                      {task.state === TASK_STATES.COMPLETED && 'Завершена'}
                    </span>
                    
                    {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
                      <button 
                        onClick={() => {setModifyState(true); setSelectedState(task.state);}} 
                        className="change-button"
                      >
                        Изменить
                      </button>
                    }
                  </div>
                ) : (
                  <div className="task-status-edit">
                    <span className="task-status-label">Статус: </span>
                    <select value={selectedState} onChange={handleChangeState} className="task-status-select">
                      <option value={TASK_STATES.NEW}>Новая</option>
                      <option value={TASK_STATES.AT_WORK}>В работе</option>
                      <option value={TASK_STATES.COMPLETED}>Завершена</option>
                    </select>
                    <button onClick={saveState} className="accept-button">
                      <FaCheck />
                    </button>
                    <button onClick={() => {setModifyState(false);}} className="close-button">
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Редактор/просмотр контента */}
          <div className="task-editor-container">
            {editMode ? (
              <div className="editor-section task-editor-section">
                <h3 className="task-editor-title">Редактор задачи</h3>
                
                <div className="editor-toolbar task-editor-toolbar">
                  <button 
                    type="button" 
                    className="toolbar-button" 
                    onClick={() => setPreview(!preview)}
                  >
                    {preview ? 'Редактировать' : 'Предварительный просмотр'}
                  </button>
                </div>

                <div className="task-editor-content">
                  {preview ? (
                    <div className="markdown-content task-preview-content">
                      <ReactMarkdown 
                        remarkPlugins={markdownPlugins.remark}
                        rehypePlugins={markdownPlugins.rehype}
                        components={markdownComponents}
                      >
                        {task.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="task-editor-wrapper">
                      <TextStyleToolbar onApplyStyle={(openTag, closeTag = openTag) => {
                        const textarea = document.querySelector('.w-md-editor-text-input');
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
                        height="100%"
                        preview="edit"
                      />
                    </div>
                  )}
                </div>

                <div className="editor-actions task-actions-panel">
                  <button 
                    onClick={handleSave} 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={() => {
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
              <div className="view-mode task-view-mode">
                <div className="markdown-content task-markdown-content" data-color-mode="light">
                  <ReactMarkdown
                    remarkPlugins={markdownPlugins.remark}
                    rehypePlugins={markdownPlugins.rehype}
                    components={markdownComponents}
                  >
                    {task.content}
                  </ReactMarkdown>
                </div>
                
                <div className="task-buttons-panel">
                  {task.state !== TASK_STATES.COMPLETED && 
                    <>
                      {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
                        <button onClick={() => setEditMode(true)} className="toolbar-button">
                          Редактировать задачу
                        </button>
                      }
                      {(userRole === ROLES_USERS.ADMIN || userRole === ROLES_USERS.EDITOR) &&
                        <button onClick={deleteTask} className="delete-button">
                          Удалить задачу
                        </button>
                      }
                    </>
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}


async function getTaskOpen(project_id, task_id) {
  try {
        const responseTask = await axiosRole.get(`/task_open/${project_id}/${task_id}`,
              {
                params: {project_id: project_id}
              }
          );
        return responseTask.data
      } catch (error) {        
        return {"error": error.error_code}
      }    
}


const TaskOpenLoader = async ({params}) => {
  
  const task_id = params.task_id  
  const project_id = params.project_id  

  const requestTask = await getTaskOpen(project_id, task_id)  
  
  return {taskLoad: requestTask}
}



export { TaskOpen, TaskOpenLoader };