import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function GroupCreateModal({ onClose, onSuccess }) {
  
    const [name_group, setName_group] = useState("_");    
  
  
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const validateForm = () => {
        if (!name_group) {
            setError("Поле с названием не заполнено, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

    const navigate = useNavigate();
      
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await API.post("/group_create/", { name_group,} );
            setLoading(false);
            setName_group("");                
            onSuccess(response.data);
            onClose();
            
        } catch (error) {
            setLoading(false);
            console.log(error)
            setError(error.response?.data?.detail || 'что-то пошло не так');            
        }    
    };
  

  return (
    <div className="modal-overlay">

      <div className="modal-content">        
        <h3>Создание группы</h3>
        
        {/* начало формы */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_name_group">Название группы: </label>
                <input 
                    placeholder="введите название"
                    name="name_group"
                    type="text"
                    id="id_name_group"
                    className="control"
                    value={name_group}
                    onChange={(e) => setName_group(e.target.value)}   
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



export { GroupCreateModal }

