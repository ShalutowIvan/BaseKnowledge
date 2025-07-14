import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, useNavigate, useLoaderData, Await, redirect, useRevalidator } from 'react-router-dom'
import { GroupsAll } from "./GroupsAll"
// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
// import MDEditor from 'mdeditor';//это по совету гугла

import 'highlight.js/styles/atom-one-dark.css'; // стили подсветки (можно выбрать любой другой)

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

    

    
    //это для загрузки фото
    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // 1. Загружаем файл
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
       // Отправляем изображение на сервер через эндпоинт бэка в папку и БД запись, и файл грузим
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
      return navigate('/knowledges/');
    }

      
  const deleteKnowledge = () => {
    if (window.confirm('Вы уверены, что хотите удалить?')) {
      // Действие при подтверждении
      axios.delete(`http://127.0.0.1:8000/delete_knowledge/${knowledge.id}`)      
      navigate("/knowledges/");
      revalidator.revalidate();//принудительная перезагрузка лоадера после редиректа в списке знаний
    }  
  };


  // Обработчики изменений для полей шапки. Тут в зависимости от имени поля в input поле в jsx вставится значение из этого поля в нужное поле
  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setKnowledge(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
        if (!knowledge.title || !knowledge.description ) {
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
                `http://127.0.0.1:8000/knowledge_update_header/${knowledge.id}`,
                {                 
                  title: knowledge.title,
                  description: knowledge.description,
                  free_access: knowledge.free_access,
                  group_id: knowledge.group_id
                }                
                );
            setEditModeHeader(false)            
            if (response.statusText==='OK') {
                setKnowledge({ ...knowledge, updated_at: response.data.updated_at});
                setKnowledge({ ...knowledge, group: response.data.group});                
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

  const [groups, setGroups] = useState([]);

  useEffect(() => {
            fetch(`http://127.0.0.1:8000/groups_all/`)
                .then(res => res.json())
                .then(data => setGroups(data));
        }, [])
      
  return (
    <>
      
      <br/><br/>
      <button onClick={goBack} className="toolbar-button">Назад</button>          
      <br/><br/>
      <div className="post-container header-section">
        
        {/*это шапка знания*/}        
        
        {/*начало шапки*/}
        {/*если не редачим шапку отображаются поля шапки*/}
        {!editModeHeader ? (
          <>
          <p>Группа: {knowledge.group.name_group}</p>
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
          {/*отображаются поля формы если редактируем шапку*/}
          {/*начало формы*/}
          
          <form onSubmit={saveHeaderChanges} style={{ marginBottom: '1rem' }}>

                <label htmlFor="id_group">Группа: </label>                
                <select
                    // className="control"
                    name="group_id"                
                    // value={knowledge.group.name_group}
                    value={knowledge.group_id}
                    onChange={handleHeaderChange}
                    // required
                >
                    {/* <option value="">{knowledge.group.name_group}</option> */}
                    {groups?.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name_group}
                        </option>
                    ))}
                </select>

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
                        value={knowledge.title}                        
                        onChange={handleHeaderChange}
                        disabled={loading}
                    />                
                    <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {knowledge.updated_at}</span>
                </div>
                <br/>

                {/*третья строка с чекбоксом*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
                  
                  <label>
                    <input
                      type="checkbox"
                      name="free_access"
                      checked={knowledge.free_access}
                      onChange={handleHeaderChange}
                      disabled={loading}
                    />
                    Свободный доступ
                  </label>
                </div>

                {/*четвертая строка с формой описания знания*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <textarea
                    placeholder="введите описание"
                    name="description"
                    value={knowledge.description}
                    onChange={handleHeaderChange}
                    disabled={loading}
                    rows={2}
                  />
                
                  <div>
                  <button className="save-button" type="submit" disabled={loading}>                    
                    {loading ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  &nbsp;&nbsp;
                  <button 
                    onClick={() => {setKnowledge(knowledgeLoad); setEditModeHeader(false);}}
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
    <div className="post-container">
      <h1>Содержание знания</h1>
      {editMode ? (

        <div className="editor-section">
          <h3>Редактор знания</h3>
          <div className="editor-toolbar">
            <button type="button" className="toolbar-button" onClick={() => setPreview(!preview)}>
              {preview ? 'Редактировать' : 'Предварительный просмотр'}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            
            <label className="upload-button">
              {loading ? 'Загрузка...' : 'Загрузить изображение'}
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
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>

            {/*кнопка отменить*/}
            <button onClick={() => {
                setKnowledge(knowledge);
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