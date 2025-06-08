import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './App.css';

function KnowledgeOpen() {
  // Состояние для списка постов
  const [posts, setPosts] = useState([]);
  // Состояние для текущего поста (создание/редактирование)
  const [currentPost, setCurrentPost] = useState({
    id: '',
    title: '',
    content: '',
    isEditing: false
  });
  // Состояние для предпросмотра Markdown
  const [preview, setPreview] = useState(false);

  // Загружаем посты при монтировании компонента
  useEffect(() => {
    fetchPosts();
  }, []);

  // Функция для загрузки постов с сервера
  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/posts/');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPost({
      ...currentPost,
      [name]: value
    });
  };

  // Обработчик отправки формы (создание/обновление поста)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentPost.isEditing) {
        // Обновляем существующий пост
        await axios.put(`http://localhost:8000/posts/${currentPost.id}`, {
          title: currentPost.title,
          content: currentPost.content
        });
      } else {
        // Создаем новый пост
        await axios.post('http://localhost:8000/posts/', {
          title: currentPost.title,
          content: currentPost.content
        });
      }
      // Сбрасываем форму и обновляем список постов
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  // Обработчик загрузки изображения
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Отправляем изображение на сервер
      const response = await axios.post('http://localhost:8000/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Вставляем Markdown-код изображения в текст
      const imageMarkdown = `![${file.name}](${response.data.url})`;
      setCurrentPost({
        ...currentPost,
        content: `${currentPost.content}\n${imageMarkdown}`
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // Функция для редактирования поста
  const handleEdit = (post) => {
    setCurrentPost({
      id: post.id,
      title: post.title,
      content: post.content,
      isEditing: true
    });
    window.scrollTo(0, 0);
  };

  // Функция для удаления поста
  const handleDelete = async (postId) => {
    try {
      await axios.delete(`http://localhost:8000/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Функция для сброса формы
  const resetForm = () => {
    setCurrentPost({
      id: '',
      title: '',
      content: '',
      isEditing: false
    });
  };

  return (
    <div className="container">
      <h1>Markdown Blog</h1>
      
      {/* Форма для создания/редактирования поста */}
      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={currentPost.title}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content (Markdown)</label>
          <div className="editor-toolbar">
            <button type="button" onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
            <label htmlFor="image-upload" className="upload-button">
              Upload Image
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          {preview ? (
            <div className="markdown-preview">
              <ReactMarkdown>{currentPost.content}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              id="content"
              name="content"
              value={currentPost.content}
              onChange={handleInputChange}
              rows="10"
              required
            />
          )}
        </div>
        
        <button type="submit" className="submit-button">
          {currentPost.isEditing ? 'Update Post' : 'Create Post'}
        </button>
        {currentPost.isEditing && (
          <button type="button" onClick={resetForm} className="cancel-button">
            Cancel
          </button>
        )}
      </form>
      
      {/* Список постов */}
      <div className="posts-list">
        <h2>Posts</h2>
        {posts.length === 0 && <p>No posts yet.</p>}
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <h3>{post.title}</h3>
            <ReactMarkdown>{post.content}</ReactMarkdown>
            <div className="post-actions">
              <button onClick={() => handleEdit(post)}>Edit</button>
              <button onClick={() => handleDelete(post.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;