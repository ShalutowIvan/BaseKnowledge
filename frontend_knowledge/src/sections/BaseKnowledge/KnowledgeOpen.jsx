import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, useNavigate, useLoaderData, Await } from 'react-router-dom'
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





// function imageAttributesPlugin() {
//   return (tree) => {
//     visit(tree, 'image', (node) => {
//       // Ищем width/height в alt-тексте как {width=300 height=200}
//       const match = /\{(.+?)\}$/.exec(node.alt || '');
//       if (match) {
//         const attrs = match[1].split(/\s+/);
//         node.data = node.data || {};
//         node.data.hProperties = node.data.hProperties || {};

//         attrs.forEach(attr => {
//           const [key, value] = attr.split('=');
//           if (key && value) {
//             node.data.hProperties[key] = value;
//           }
//         });

//         // Чистим alt-текст от {width=...}
//         node.alt = node.alt.replace(/\{.+\}$/, '').trim();
//       }
//     });
//   };
// }

function KnowledgeOpen() {

    const textareaRef = useRef(null);//для вставки панели форматирования текста

    const { knowledgeLoad } = useLoaderData();
    const [editMode, setEditMode] = useState(false);    
    const [preview, setPreview] = useState(false);

    // const {slug} = useParams();
    const [knowledge, setKnowledge] = useState(knowledgeLoad);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Обработчик изменений для MDEditor. Это пока убрали, так как у МД есть свой проп onChange
    const handleTextChange = (value) => {
      setKnowledge({ ...knowledge, content: value || '' });
    };


    // const handleTextChange = (value) => {
    //   setKnowledge((prev) => ({ ...prev, content: value }))
    // };



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

    


        
  return (
    <>
      <aside>
      <GroupsAll />
      </aside>

      <h1>Содержание знания</h1>
        <button onClick={goBack} className="toolbar-button">Назад</button>

        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <br/>
    
          <h2>Название знания: {knowledge.title}</h2>  
          <h2>Описание: {knowledge.description}</h2>  

          {/*<h2>Дата создания: {knowledge.created_at}</h2>  
          
          <h2>Содержание: {knowledge.content}</h2>  
          <h2>Свободный доступ: 
          {!knowledge.free_access && <> Не разрешен</>}
          {knowledge.free_access && <> Разрешен</>}
          </h2>  */}

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
            {/*смотреть как сделано в вик контура*/}
            
            {/*<div style={{ marginBottom: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select onChange={(e) => applyFontSize(e.target.value)}>
                <option value="">Размер шрифта</option>
                <option value="12px">12px</option>
                <option value="16px">16px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>             
            </div>*/}

            {/*предыдущий вариант тулбара*/}

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
              Редактировать
            </button>

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