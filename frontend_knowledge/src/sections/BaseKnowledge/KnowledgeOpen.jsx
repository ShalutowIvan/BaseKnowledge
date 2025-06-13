import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, useNavigate, useLoaderData, Await, redirect, useRevalidator } from 'react-router-dom'
import { GroupsAll } from "./GroupsAll"
// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
// import MDEditor from 'mdeditor';//это по совету гугла
import rehypeRaw from 'rehype-raw';

// плагины по совету чатагпт
import remarkGfm from 'remark-gfm'; // поддержка GFM (checkboxes, tables и пр.)
import rehypeHighlight from 'rehype-highlight'; // подсветка синтаксиса
import 'highlight.js/styles/atom-one-dark.css'; // стили подсветки (можно выбрать любой другой)
import { visit } from 'unist-util-visit';
import remarkDirective from 'remark-directive';
import { markdownPlugins, markdownComponents } from './MDutils/UtilsImageMD';
import { TextStyleToolbar } from './MDutils/TextStyleToolbar';


function KnowledgeOpen() {
    const revalidator = useRevalidator();    

    const { knowledgeLoad } = useLoaderData();//лоадер знания
    const [editMode, setEditMode] = useState(false);//это для редактирования контента знания
    const [preview, setPreview] = useState(false);//предварительный просмотр при редактировании контента
    
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки знания

    // const {slug} = useParams();
    const [knowledge, setKnowledge] = useState(knowledgeLoad);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

        
    // Обработчик изменений для MDEditor. Это пока убрали, так как у МД есть свой проп onChange
    const handleTextChange = (value) => {
      setKnowledge({ ...knowledge, content: value || '' });
    };

    //3 функции ниже для изменения шапки
    const handleTextTitle = (value) => {
      setKnowledge({ ...knowledge, title: value || '' });
    };

    const handleTextDescription = (value) => {
      setKnowledge({ ...knowledge, description: value || '' });
    };

    const handleFree_access = (value) => {
      setKnowledge({ ...knowledge, free_access: value || '' });
    };

    
    //это для загрузки фото
    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // 1. Загружаем файл
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
       // Отправляем изображение на сервер через эндпоинт бэка в и БД запись, и файл грузим
        const response = await axios.post(`http://127.0.0.1:8000/upload-image/${knowledge.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        // 2. Вставляем Markdown-код изображения в текст. При вставке изображения оно происходит переход на следующую строку из-за \n        
        const imageMarkdown = `![${file.name}](${response.data.url})`;
        setKnowledge(prev => ({
          ...prev,
          content: prev.content + imageMarkdown
        }));

      } catch (error) {
        console.error('Upload failed:', error);
        // alert('Image upload failed');
        setError('Image upload failed');
      } finally {
        setLoading(false);
      }
    };
    
    // сохранение после редактирования знания
    const handleSave = async () => {
    try {
      //тут идет отправка текста знания на сервер. Если ссылку на изображение удалить сервер удалит и изображение из БД и файл с сервера
      setLoading(true);
      await axios.put(`http://127.0.0.1:8000/knowledges_update/${knowledge.id}`, {
            // title: knowledge.title,
            content: knowledge.content
          });      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving knowledge: ', error);
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
    };

    const navigate = useNavigate();

    const goBack = () => {
      return navigate(-1);
    }

    // функции для изменения размера и стиля шрифта

    // Вставка текста в редактор
    const insertAtCursor = (wrapperFn) => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const before = knowledge.content.slice(0, start);
      const selected = knowledge.content.slice(start, end);
      const after = knowledge.content.slice(end);

      // Получаем обернутый текст
      const wrapped = wrapperFn(selected || 'ваш текст');

      const updated = `${before}${wrapped}${after}`;

      setKnowledge(prev => ({ ...prev, content: updated }));

      setTimeout(() => {
        textarea.focus();
        // Курсор после вставки
        textarea.selectionStart = textarea.selectionEnd = before.length + wrapped.length;
      }, 0);
    };


    // Функции для вставки
    const applyFontSize = (size) => {
      if (!size) return;
      insertAtCursor((text) => `<span style="font-size: ${size};">${text}</span>`);
    };

  const applyFontStyle = (style) => {
      if (!style) return;

      insertAtCursor((text) => {
        if (style === 'bold') {
          return `<span style="font-weight: bold;">${text}</span>`;
        } else if (style === 'italic') {
          return `<span style="font-style: italic;">${text}</span>`;
        } else if (style === 'monospace') {
          return `<span style="font-family: monospace;">${text}</span>`;
        }
        return text;
      });
    };

  
  const deleteKnowledge = () => {
    if (window.confirm('Вы уверены, что хотите удалить?')) {
      // Действие при подтверждении
      axios.delete(`http://127.0.0.1:8000/delete_knowledge/${knowledge.id}`)      
      navigate("/knowledge/");
      revalidator.revalidate();//принудительная перезагрузка лоадера после редиректа в списке знаний
    }  
  };
  
    
      
  return (
    <>
      <aside>
      <GroupsAll />
      </aside>



        <div className="post-container">
        {/*это шапка знания*/}
        <h1>Содержание знания</h1>
        <button onClick={goBack} className="toolbar-button">Назад</button>          
          {/*начало шапки*/}
          {/*если не редачим шапку*/}
          {editModeHeader ? (
          <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {knowledge.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{knowledge.title}</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {knowledge.updated_at}</span>
          </div>
          <br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>            
              <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Свободный доступ: 
              {!knowledge.free_access && <> Не разрешен</>}
              {knowledge.free_access && <> Разрешен</>}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{knowledge.description}</span>
            
            <button onClick={() => setEditModeHeader(true)} className="toolbar-button">
              Редактировать шапку
            </button>
            
          </div>
          </>
          ) : (
          <>
          {/*тут форма если редактируем шапку*/}

          {/*начало формы*/}

          <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>                
                {/*первая строка без формы*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
                  <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {knowledge.created_at}</span>
                </div>

                {/*вторая строка с формой названия знания*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
                  {/*<label htmlFor="id_title">Название знания: </label>*/}
                    <input 
                        placeholder="введите назвнаие"
                        name="title"
                        type="text"
                        id="id_title"
                        className="control"                        
                        value={knowledge.title}
                        // onChange={(e) => setTitle(e.target.value)}   
                        onChange={handleTextTitle}
                    />
                  <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {knowledge.updated_at}</span>
                </div>
                <br/>

                {/*третья строка с чекбоксом*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
                  
                  <input
                    type="checkbox"
                    checked={knowledge.free_access}
                    onChange={handleFree_access}
                  />
                  <label>Выбрать</label>
                </div>

                {/*четвертая строка с формой описания знания*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <input 
                    placeholder="введите описание"
                    name="description"
                    type="text"
                    id="id_description"
                    className="control"                        
                    value={knowledge.description}
                    onChange={handleTextDescription}   
                  />
                
                  <>
                  <button className="save-button" type="submit" disabled={loading}>                    
                    {loading ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  
                  <button 
                    onClick={() => {setKnowledge(knowledge); setEditMode(false);}}
                    className="cancel-button"
                    disabled={loading}>Отмена</button>
                  </>                  
                </div>
                {/*конец четвертой строки*/}
              {error && <p style={{ color: 'red'}}>{error}</p>}
            </form>

          {/*конец формы*/}



          {/*<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {knowledge.created_at}</span>
          </div>*/}

          {/*<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{knowledge.title}</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {knowledge.updated_at}</span>
          </div>
          <br/>*/}
          
          {/*<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Свободный доступ: 
              {!knowledge.free_access && <> Не разрешен</>}
              {knowledge.free_access && <> Разрешен</>}</span>
          </div>*/}


          {/*<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{knowledge.description}</span>
            <button>Редактировать</button>
          </div>*/}
          </>
            )
          }
        

        </div>

    <br/>

    {/*ниже редактор контента знания*/}
    <div className="post-container">
      {editMode ? (

        <div className="editor-section">
          <h3>Редактор знания</h3>
          <div className="editor-toolbar">
            <button type="button" className="toolbar-button" onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            
            <label className="upload-button">
              {loading ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                style={{ display: 'none' }}
              />
            
            </label>
          </div>

           

            {/*предпросмотр получившегося маркдаун*/}
           {preview ? (
            <div className="markdown-content">
              <ReactMarkdown 
              remarkPlugins={markdownPlugins.remark}
              rehypePlugins={markdownPlugins.rehype}
              components={markdownComponents}
              >
                {knowledge.content}
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

              setKnowledge(prev => ({ ...prev, content: newText }));
            }} />
            
            <MDEditor              
              value={knowledge.content}
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
                {loading ? 'Saving...' : 'Save'}
              </button>

            {/*кнопка отменить*/}
            <button onClick={() => {
                setKnowledge(knowledge);
                setEditMode(false);
              }}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
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
                {knowledge.content}
              </ReactMarkdown>
            </div>
            <br/>
            <button onClick={() => setEditMode(true)} className="toolbar-button">
              Редактировать знание
            </button>

            <button onClick={deleteKnowledge} className="delete-button">Удалить знание</button>

        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
                    
                    
    </>
    )
}


async function getKnowledgeOpen(slug) { 
  const res = await fetch(`http://127.0.0.1:8000/knowledges_open/${slug}`)//тут берутся все элементы с одним и тем же номером документа

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


const KnowledgeOpenLoader = async ({params}) => {
  
  const slug = params.slug//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  return {knowledgeLoad: await getKnowledgeOpen(slug)}
}



export { KnowledgeOpen, KnowledgeOpenLoader };