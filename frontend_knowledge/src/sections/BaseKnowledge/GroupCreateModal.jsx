import { useState, useEffect } from 'react';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function GroupCreateModal({ onClose, onSuccess }) {
  
    const [name_group, setName_group] = useState("");  
  
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const validateForm = () => {
        if (!name_group || name_group.trim() === "") {
            setError("Поле с названием не заполнено, заполните, пожалуйста!");
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
            const response = await API.post("/group_create/", { name_group,} );            
            setName_group("");                
            onSuccess(response.data);
            onClose();            
        } catch (err) {            
            console.log("Error whith create group:", err)
            setError(err.message || 'что-то пошло не так');            
        } finally {
            setLoading(false);  
        }    
    };

  useEffect(() => {
      const handleEscape = (e) => {
        if (e.keyCode === 27 && !loading) {
          onClose();
        }
      };    
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [loading, onClose]);
  
  const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget && !loading) {
        onClose();
      }
    };
  

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>

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
            type="button"
            onClick={onClose}
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

