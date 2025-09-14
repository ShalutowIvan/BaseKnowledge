import React, { useState, useEffect, useRef, useCallback  } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { API } from "../../apiAxios/apiAxios"
import { useParams, Link, useNavigate, useLoaderData, Await, redirect, useRevalidator } from 'react-router-dom'
// import { GroupsAll } from "./GroupsAll"
// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
// import MDEditor from 'mdeditor';//это по совету гугла

import 'highlight.js/styles/atom-one-dark.css'; // стили подсветки (можно выбрать любой другой)

import { markdownPlugins, markdownComponents } from './MDutils/UtilsImageMD';
import { TextStyleToolbar } from './MDutils/TextStyleToolbar';

import { CopyLinkButton } from './CopyLinkButton';


function KnowledgeOpenContent({ knowledge, onUpdate, onDeleteKnowledge, onCloseTab }) {
    // const revalidator = useRevalidator();    

    // const { knowledgeLoad } = useLoaderData();//лоадер знания




    const [editMode, setEditMode] = useState(false);//это для редактирования контента знания
    const [preview, setPreview] = useState(false);//предварительный просмотр при редактировании контента
    
    const [editModeHeader, setEditModeHeader] = useState(false);//это для редактирования шапки знания

    const {slug_gr} = useParams();
    // const [knowledge, setCurrentKnowledge] = useState(knowledgeLoad);
    const [currentKnowledge, setCurrentKnowledge] = useState(knowledge);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [groups, setGroups] = useState([]);

    const navigate = useNavigate();
        
    // Синхронизация с пропсом knowledge
    useEffect(() => {
      setCurrentKnowledge(knowledge);
    }, [knowledge]);

    // Загрузка групп для контекстного меню при редактировании шапки знания
    useEffect(() => {
      const fetchGroups = async () => {
        try {
          const response = await API.get('/groups_all/');
          setGroups(response.data);
        } catch (error) {
          console.error('Ошибка загрузки групп:', error);
        }
      };
      fetchGroups();
    }, []);

    // Обработчик изменений для MDEditor. Это пока убрали, так как у МД есть свой проп onChange
    const handleTextChange = (value) => {
      setCurrentKnowledge({ ...currentKnowledge, content: value || '' });
    };

  

  /**
  * Мемоизированный обработчик загрузки изображений
  * Сложная логика - useCallback предотвращает пересоздание
  */
  const handleImageUpload = useCallback(async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await API.post(`/upload-image/${currentKnowledge.id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        const imageMarkdown = `\n![${file.name}](${response.data.url})\n`;
        setCurrentKnowledge((prev) => ({
          ...prev,
          content: prev.content + imageMarkdown
        }));

      } catch (error) {
        console.error('Upload failed:', error);
        setError('Ошибка загрузки изображения');
      } finally {
        setLoading(false);
      }
    }, [currentKnowledge.id]); // Зависимость от ID знания

  

    /**
     * Мемоизированный обработчик сохранения контента. Он сохраняет контент знания на сервере
     * useCallback обеспечивает стабильность для обработчиков событий
     */
    const handleSave = useCallback(async () => {
      try {
        setLoading(true);
        const updatedKnowledgeServer = await API.put(`/knowledges_update/${currentKnowledge.id}`,
          { content: currentKnowledge.content }
        );

        // ФИКС: Создаем обновленный объект знания
        const updatedKnowledge = {
          ...currentKnowledge,
          content: currentKnowledge.content,
          // updated_at: new Date().toISOString(), // или с сервера
          updated_at: updatedKnowledgeServer.updated_at
        };// тут муть, скоре всего норм, но проверить

        setEditMode(false);
        // Сообщаем родителю об обновлении, обновление в массиве вкладок делаем setActiveTabs
        onUpdate(currentKnowledge.id, updatedKnowledge);
      } catch (error) {
        console.error('Error saving knowledge: ', error);
        setError('Ошибка сохранения');
      } finally {
        setLoading(false);
      }
    }, [currentKnowledge, onUpdate]); // Зависимости от текущего знания и функции обновления


    
      
  const deleteKnowledge = useCallback( () => {
    if (window.confirm('Вы уверены, что хотите удалить?')) {
      // Действие при подтверждении
      API.delete(`/delete_knowledge/${knowledge.id}`)
      onCloseTab(knowledge.id)
      onDeleteKnowledge(knowledge.id)
      // не меняется состояние списка знаний! Возможно сделать ревалидатор лоадера ОСТ ТУТУ!!!!!!!!!!!!!
      // navigate(`/knowledges/${group_slug}`);
      // revalidator.revalidate();//принудительная перезагрузка лоадера после редиректа в списке знаний
    }  
  }, []);


  // Обработчики изменений для полей шапки. Тут в зависимости от имени поля в input поле в jsx вставится значение из этого поля в нужное поле
  // const handleHeaderChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   setCurrentKnowledge(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? checked : value
  //   }));
  // };

  /**
     * Мемоизированный обработчик изменений в шапке
     * useCallback оптимизирует производительность формы
     */
  const handleHeaderChange = useCallback((e) => {
      const { name, value, type, checked } = e.target;
      setCurrentKnowledge(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }, []);


  // валидацию не оборачивал в колбек...
  const validateForm = () => {
        if (!currentKnowledge.title || !currentKnowledge.description ) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

  //функция для формы шапки знания
  const saveHeaderChanges = useCallback(async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        try {            
            setLoading(true);
            const response = await API.patch(`/knowledge_update_header/${knowledge.id}`,
                {                 
                  title: currentKnowledge.title,
                  description: currentKnowledge.description,
                  free_access: currentKnowledge.free_access,
                  group_id: currentKnowledge.group_id
                }                
                );
            
            if (response.statusText==='OK') {
                // ФИКС: Создаем обновленный объект
                const updatedKnowledge = {
                  ...currentKnowledge,
                  updated_at: response.data.updated_at,
                  group: response.data.group,
                  title: response.data.title,
                  description: response.data.description
                };

                
                setCurrentKnowledge(updatedKnowledge);//в текущем знании главное обновить группу и время обновления
                onUpdate(knowledge.id, updatedKnowledge);//это обновление таба в основном компоненте. Там функция называется updateTabKnowledge. Она меняет и названия в списке знаний                
                console.log("Update complete!")                
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }

            
            setEditModeHeader(false);
            

        } catch (error) {            
            console.log(error)
            setError('что-то пошло не так');            
        } finally {
          setLoading(false);
        }    
    }, [currentKnowledge, knowledge.id, onUpdate]);

  // ФИКС: Восстановление исходных данных при отмене
  const cancelHeaderEdit = useCallback(() => {
    setCurrentKnowledge(knowledge);
    setEditModeHeader(false);
  }, [knowledge]);
  
  const urlToCopy = `localhost:5173/knowledge_open_free/${currentKnowledge.slug}`
      
  return (
    <>
            
      <div className="knowledges-container section-frame">
        
        {/*это шапка знания*/}        
        
        {/*начало шапки*/}
        {/*если не редачим шапку отображаются поля шапки*/}
        {!editModeHeader ? (
          <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>Группа: {currentKnowledge?.group.name_group}</span>
            <button onClick={() => setEditModeHeader(true)} className="change-button">              
              </button>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {currentKnowledge.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{currentKnowledge.title}</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {currentKnowledge.updated_at}</span>
          </div>
          <br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>            
              <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Свободный доступ: 
              {!currentKnowledge.free_access && <> Не разрешен</>}
              {currentKnowledge.free_access && 
              <> Разрешен              
              </>}
              </span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{currentKnowledge.description}</span>
            {/*кнопка для копирования ссылки*/}
            {currentKnowledge.free_access &&
            <CopyLinkButton textUrl={urlToCopy} />}
          
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
                    value={currentKnowledge.group_id}
                    onChange={handleHeaderChange}
                    // required
                >                    
                    {groups?.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name_group}
                        </option>
                    ))}
                </select>

                {/*первая строка без формы*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
                  <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {currentKnowledge.created_at}</span>
                </div>

                {/*вторая строка с формой названия знания*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
                  {/*<label htmlFor="id_title">Название знания: </label>*/}
                    <input 
                        placeholder="введите назвнаие"
                        name="title"
                        type="text"                        
                        value={currentKnowledge.title}                        
                        onChange={handleHeaderChange}
                        disabled={loading}
                    />                
                    <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {currentKnowledge.updated_at}</span>
                </div>
                <br/>
                
                {/*третья строка с чекбоксом*/}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>          
                  
                  <label>
                    <input
                      type="checkbox"
                      name="free_access"
                      checked={currentKnowledge.free_access}
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
                    value={currentKnowledge.description}
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
                    onClick={() => {cancelHeaderEdit}}
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
    <div className="knowledges-container">
      <h1>Содержание знания</h1>
      {editMode ? (

        <div>
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
                {currentKnowledge.content}
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

              setCurrentKnowledge(prev => ({ ...prev, content: newText }));
            }} />
            
            <MDEditor              
              value={currentKnowledge.content}
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
                setCurrentKnowledge(knowledge);
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
        <div>         
          <div className="markdown-content" data-color-mode="light">
              <ReactMarkdown
                remarkPlugins={markdownPlugins.remark}
                rehypePlugins={markdownPlugins.rehype}
                components={markdownComponents}
                >
                {currentKnowledge.content}
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


// async function getKnowledgeOpen(kn_id) {  

//   try {
//         const res = await API.get(`/knowledges_open/${kn_id}`);
//         // console.log(res)
//         return res.data
//       } catch (error) {
       
//         console.log("Ошибка из detail:", error.response?.data?.detail)
                
//         return {"error": error.response?.data?.detail}
//       }
 
// }


// const KnowledgeOpenLoader = async ({params}) => {
  
//   const kn_id = params.kn_id//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
//   return {knowledgeLoad: await getKnowledgeOpen(kn_id)}
// }



// export { KnowledgeOpenContent };
export default React.memo(KnowledgeOpenContent);