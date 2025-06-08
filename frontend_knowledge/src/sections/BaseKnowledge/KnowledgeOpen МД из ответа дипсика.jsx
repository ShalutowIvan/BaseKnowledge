import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, useNavigate, useLoaderData, Await } from 'react-router-dom'
import { GroupsAll } from "./GroupsAll"
// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
import rehypeRaw from 'rehype-raw';



function KnowledgeOpen() {
    // const [title, setTitle] = useState("");
    // const [description, setDescription] = useState("");
    // const [content, setContent] = useState("");    
    // const [created_at, setCreated_at] = useState("");    
    // const [updated_at, setUpdated_at] = useState("");    
    // const [free_access, setFree_access] = useState(false);    
    // const [group_id, setGroup_id] = useState(null);    
    // const [images, setImages] = useState("");


    const { knowledgeLoad } = useLoaderData();
    const [editMode, setEditMode] = useState(false);    
    const [preview, setPreview] = useState(false);

    const {slug} = useParams();
    const [knowledge, setKnowledge] = useState(knowledgeLoad);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    //функция для изменения текста в контенте
    // const handleTextChange = (e) => {
    // setKnowledge({ ...knowledge, content: e.target.value });
    // };

    // Обработчик изменений для MDEditor. Это пока убрали, так как у МД есть свой проп onChange
    // const handleTextChange = (value) => {
    //   setKnowledge({ ...knowledge, content: value || '' });
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
        const imageMarkdown = `\n![${file.name}](${response.data.url})\n`;
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


    // проверить ввод текста с библиотекой md которую импортировал выше
    
  return (
    <>
      <GroupsAll />

      <h1>Содержание знания</h1>
        <button onClick={goBack}>Назад</button>

        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <br/>

          <h2>Название знания: {knowledge.title}</h2>  
          
          {/*<h2>Дата создания: {knowledge.created_at}</h2>  
          <h2>Описание: {knowledge.description}</h2>  
          <h2>Содержание: {knowledge.content}</h2>  
          <h2>Свободный доступ: 
          {!knowledge.free_access && <> Не разрешен</>}
          {knowledge.free_access && <> Разрешен</>}
          </h2>  */}

    <div className="post-container">
      {editMode ? (
        <div className="editor-section">
          <div className="editor-toolbar">
            <button type="button" onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
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

          
          <MDEditor
              value={knowledge.content}
              onChange={handleTextChange}
              height={400}
              preview="edit"
              extraCommands={[]}
            />

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
                setKnowledge(knowledgeLoad);
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
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {knowledge.content}
              </ReactMarkdown>
            </div>
            <button 
              onClick={() => setEditMode(true)} 
              className="edit-button"
            >
              Edit
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