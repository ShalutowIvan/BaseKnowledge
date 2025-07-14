import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';


// onSave - делает запрос на сохранение текста поста вместе со ссылками на изображение. В функции handleImageUpload идет загрузка изображения по урл с бэка /upload-image/ для сохранения файла

// это компонент для редактирования, только редактирования, отрисовку поста он не делает!!!!!!!!!!!! Отрисовка поста идет при открытии поста, в файле KnowledgeOpen.jsx


const PostEditor = ({ post, onSave, onCancel }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedPost, setEditedPost] = useState(post);
  const [preview, setPreview] = useState(false);

  // Синхронизируем состояние при получении нового поста
  useEffect(() => {
    setEditedPost(post);
  }, [post]);

  const handleTextChange = (e) => {
    setEditedPost({ ...editedPost, content: e.target.value });
  };

  // Обработчик загрузки изображения. При вставке изображения оно сразу улетает на сервер и на фронте в посте прописывается ссылка по формату markdown. 
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 1. Загружаем файл
      const formData = new FormData();
      formData.append('file', file);
      
      // Отправляем изображение на сервер через эндпоинт бэка
      const response = await axios.post('http://127.0.0.1:8000/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // const { data } = await axios.post('/upload-image/', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //           }
      //   }   );


      // 2. Вставляем Markdown-код изображения в текст. При вставке изображения оно происходит переход на следующую строку из-за \n
      // const markdown = `![${file.name}](${data.url})`;
      const imageMarkdown = `![${file.name}](${response.data.url})`;
      setEditedPost(prev => ({
        ...prev,
        content: `${prev.content}\n${imageMarkdown}`
      }));

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Image upload failed');
    }
  };



  const handleSave = async () => {
    try {
      await onSave(editedPost);//тут идет отправка текста знания на сервер. Если ссылку на изображение удалить сервер удалит и изображение из БД и файл с сервера
      setEditMode(false);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };





  return (
    <div className="post-container">
      {editMode ? (
        <div className="editor-section">
          <div className="editor-toolbar">
            <button type="button" onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
            <label className="upload-button">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {preview ? (
            <div className="markdown-preview">
              <ReactMarkdown>{editedPost.content}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={editedPost.content}
              onChange={handleTextChange}
              rows={10}
            />
          )}

          <div className="editor-actions">
            <button onClick={handleSave} className="save-button">
              Save
            </button>
            <button onClick={() => {
              setEditedPost(post);
              setEditMode(false);
            }} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="view-mode">
          <ReactMarkdown>{post.content}</ReactMarkdown>
          <button 
            onClick={() => setEditMode(true)} 
            className="edit-button"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default PostEditor;