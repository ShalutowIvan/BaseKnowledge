import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function RoadMapDeleteModal({ onClose, onSuccess, error }) {
    
  
  return (
    <div className="modal-overlay">

      <div className="modal-content">        
        <h2>Удаление дорожной карты</h2>
        <h3>Вы действительно хотите удалить мапу?</h3>
                
        <div className="modal-actions">
          <button 
            onClick={onSuccess}
            className="cancel-button"
            // disabled={loading}            
          >
            Удалить
          </button>

          <button 
            onClick={onClose} 
            // disabled={loading}
            className="save-button"            
          >
            Отмена
          </button>
            
        </div>        
      
        {error && <div className="error-message">Ошибка при удалении: {error}</div>}
      </div>
    </div>
  );
}



export { RoadMapDeleteModal }

