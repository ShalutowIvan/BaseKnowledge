import { useState, useEffect } from 'react';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function ProjectCreateModal({ onClose, onSuccess }) {
  
  const [title, setTitle] = useState("");    
  const [description, setDescription] = useState("");    
  
  const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);


  useEffect(() => {
    const handleEscape = (e) => {
      if (e.keyCode === 27 && !loading) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [loading, onClose]);


  const validateForm = () => {
        if (!title.trim() || !description.trim()) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }  
  
  const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        

        try {
            setLoading(true);
            setError(null);
            const response = await API.post(
                  "http://127.0.0.1:8000/project_create/",
                  {                 
                      title: title.trim(),                    
                      description: description.trim(),
                  }                
                );                     
                            
              onSuccess(response.data);
              onClose();      
              
        } catch (error) {            
            console.log("Error whith create project:", error)
            setError(`Ошибка при создании проекта: ${error.message}`);
        } finally {
          setLoading(false);
        }  
    };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  


  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>

      <div className="modal-content">        
        <h3>Создание проекта</h3>        
        
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>                

                <label htmlFor="id_title">Заголовок проекта: </label>
                <input 
                    placeholder="введите заголовок"
                    name="title"
                    type="text"
                    id="id_title"
                    className="control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}   
                />

                <br/><br/>

                <label htmlFor="id_description">Описание: </label>
                <textarea 
                    placeholder="введите описание"
                    name="description"
                    id="id_description"
                    className="control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={2}
                />
        
        <div className="modal-actions">
          <button
            type="submit"
            disabled={loading}
            className="save-button"
          >
            {loading ? 'Загрузка...' : 'Создать'}
          </button>

          <button 
            type="button"
            onClick={onClose} 
            disabled={loading}
            className="cancel-button"
          >
            Отмена
          </button>
          
        </div>
        {error && <div className="error-message">{error}</div>}
      
      </form>

      </div>
    </div>
  );
}



export { ProjectCreateModal }

