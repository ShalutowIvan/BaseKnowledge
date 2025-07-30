import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function ProjectDeleteModal({ onClose, onSuccess }) {
    
  
  return (
    <div className="modal-overlay">

      <div className="modal-content">        
        <h2>Удаление проекта</h2>
        <h3>Вы действительно хотите удалить проект?</h3>
                
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
      

      </div>
    </div>
  );
}



export { ProjectDeleteModal }

