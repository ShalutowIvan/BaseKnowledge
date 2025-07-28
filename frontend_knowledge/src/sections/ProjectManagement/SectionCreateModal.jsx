import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"
import { axiosRole } from "./axiosRole/axiosRole"



function SectionCreateModal({ project_id, onClose, onSuccess }) {
  
  const [title, setTitle] = useState("_");    
  const [description, setDescription] = useState("_");    
  
  const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);


  const validateForm = () => {
        if (!title || !description) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        // setError('');
        return true;
    }

  const navigate = useNavigate();
  
  const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await axiosRole.post(
                `http://127.0.0.1:8000/section_create/${project_id}`,
                {                 
                    title,                    
                    description,
                },
                {
                  params: {project_id: project_id},
                }
                
                );
            setLoading(false);
                        
            if (response.statusText==='OK') {
              setTitle("");
              setDescription("");
                                        
              onSuccess(response.data);
              onClose();
      
            } else {
                const errorData = await response.data
                console.log(errorData, 'тут ошибка')     
            }
        } catch (error) {
            setLoading(false);
            console.log(error.message)
            setError(error.message);            
        }    
    };
  

  return (
    <div className="modal-overlay">

      <div className="modal-content">        
        <h3>Создание раздела</h3>
        
        {/* начало формы */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_title">Заголовок раздела: </label>
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
                <input 
                    placeholder="введите описание"
                    name="description"
                    type="text"
                    id="id_description"
                    className="control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}   
                />
        
        <div className="modal-actions">
          <button 
            // onClick={handleDelete}
            type="submit"
            disabled={loading}
            className="save-button"
          >
            {loading ? 'Загрузка...' : 'Создать'}
          </button>

          <button 
            onClick={onClose} 
            disabled={loading}
            className="cancel-button"
          >
            Отмена
          </button>
      
      
        </div>
        {error && <div className="error-message">{error}</div>}
      {/* конец формы */}
      </form>

      </div>
    </div>
  );
}



export { SectionCreateModal }

