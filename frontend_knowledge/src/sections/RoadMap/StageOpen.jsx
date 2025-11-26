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
import { API } from "../../apiAxios/apiAxios"




function StageOpen() {
    const revalidator = useRevalidator();
    
    const { stageLoad } = useLoaderData();

    if (stageLoad?.error) {
      return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {stageLoad["error"]}. Пройдите авторизацию.</h1>
    }

    const [editMode, setEditMode] = useState(false);//это для редактирования контента
    const [preview, setPreview] = useState(false);//предварительный просмотр при редактировании контента
    const { roadmap_id, chapter_id, stage_id } = useParams();

    const [stage, setStage] = useState(stageLoad);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const STAGE_STATES = {
        NOT_STUDIED: 'not_studied',
        IN_THE_STUDY: 'in_the_study',
        COMPLETED: 'completed'
      };
        
    // Обработчик изменений для MDEditor. Это пока убрали, так как у МД есть свой проп onChange
    const handleTextChange = (value) => {
      setStage({ ...stage, content: value || '' });
    };

        
    // сохранение после редактирования контента
    const handleSave = async () => {
      try {
        //тут идет отправка текста на сервер.
        setLoading(true);
        await API.put(`/stage_update/${stage.id}`, 
            { content: stage.content }            
            );      
        setEditMode(false);
      } catch (error) {
        console.error('Error saving stage: ', error);
        setError(error || 'Failed to save changes');
      } finally {
        setLoading(false);
      }
      };


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);                
                if (stageLoad && !stageLoad.error) {
                    setStage(stageLoad);
                }                

            } catch (err) {
                setError(`Ошибка загрузки данных: ${err.error}`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [stage_id]);
    
    const navigate = useNavigate();

    const goStageList = () => {
      return navigate(`/roadmaps/open/${roadmap_id}/chapter_open/${chapter_id}`);
    }

      
  const deleteStage = async () => {
    if (window.confirm('Вы уверены, что хотите удалить?')) {
      // Действие при подтверждении
      try {
        await API.delete(`/delete_stage/${stage.id}`)
        navigate(`/roadmaps/open/${roadmap_id}/chapter_open/${chapter_id}`,
        {
            state: { deletedStageId: stage_id }, // Передаем ID удаленной секции
            replace: true // Важно: заменяем текущую запись в истории
          });
      // revalidator.revalidate();//принудительная перезагрузка лоадера после редиректа
      } catch (error) {
          console.error('Ошибка при удалении:', error);
      }
    }  
  };

        
  return (
    <>
            
      <div className="stage-container">
        <div className='header-section'>
        {/*это шапка таски*/}        
        {/*начало шапки*/}       
        
          <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {stage.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{stage.title}</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {stage.updated_at}</span>
          </div>
          <br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>            
              
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{stage.description}</span>
                        
          </div>
          </>          
            
          
      </div>
    <br/>
    {/*ниже редактор контента знания*/}
    
      <button onClick={goStageList} className="toolbar-button">Закрыть</button>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>Содержание этапа</h1>          
                   
      </div>
      
      {/*тут буждет стиль для поля редактирования*/}
      {/*className="custom-md-editor"*/}
      <div >

      {editMode ? (

        <div className="editor-section">
          <h3>Редактор этапа</h3>
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
                {stage.content}
              </ReactMarkdown>
            </div>
          ) : (
            
            <>            
            <TextStyleToolbar onApplyStyle={(openTag, closeTag = openTag) => {
              const textarea = document.querySelector('.w-md-editor-text-input'); // получаем textarea MDEditor
              if (!textarea) return;

              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selected = textarea.value.slice(start, end);
              const before = textarea.value.slice(0, start);
              const after = textarea.value.slice(end);

              const newText = `${before}${openTag}${selected}${closeTag}${after}`;

              setStage(prev => ({ ...prev, content: newText }));
            }} />
            
            <MDEditor              
              value={stage.content}
              onChange={handleTextChange}
              height={500}
              preview="edit"
              // style={{ width: '70%' }}            
            />
            {/*</div>*/}
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
                setStage(stage);
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
                {stage.content}
              </ReactMarkdown>
            </div>
            <br/>
            {stage.state !== STAGE_STATES.COMPLETED && 
            <>
              <button onClick={() => setEditMode(true)} className="toolbar-button">
                Редактировать этап
              </button>
            
            
            
              <button onClick={deleteStage} className="delete-button">Удалить этап</button>
            
            </>
            }            

        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
    </div>                    
    </>
    )
}


async function getStageOpen(stage_id) {
  try {
        const responseStage = await API.get(`/stage_open/${stage_id}`);
        return responseStage.data
      } catch (error) {        
        return {"error": error}
      }    
}





const StageOpenLoader = async ({params}) => {  
  const stage_id = params.stage_id
  const requestStage = await getStageOpen(stage_id)    
  return {stageLoad: requestStage}
}



export { StageOpen, StageOpenLoader };