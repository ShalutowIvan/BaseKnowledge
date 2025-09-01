import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function KnowledgeCreateModal({ onClose, onSuccess }) {
  
    const [title, setTitle] = useState("_");    
    const [description, setDescription] = useState("_");    
    const [groupCr, setGroupCr] = useState(null);
  
    const [groupsCr, setGroupsCr] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
        try {
          const response = await API.get('/groups_all/');
          setGroupsCr(response.data);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
        };        
        fetchData();
    }, [])


    const validateForm = () => {
        if (!title || !description || !groupCr) {
            setError("Есть пустые поля, заполните, пожалуйста!");
            return false;
        }
        setError('');
        return true;
    }

    
      
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const response = await API.post("/knowledges_create/", 
                {
                    title: title, 
                    description: description, 
                    group_id: groupCr,
                } );
            setLoading(false);
            // setTitle("")
            // setDescription("")
            // setGroupCr(null);
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
        <h3>Создание знания</h3>
        
        {/* начало формы */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                

                <label htmlFor="id_title">Название знания: </label>
                <input 
                    placeholder="введите название"
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

                <br/><br/>

                <label htmlFor="id_groupCr">Группа: </label>                
                <select
                    // style={buttonStyle}
                    name="groupCr"
                    id="id_groupCr"
                    // className="control"                        
                    value={groupCr}
                    onChange={(e) => setGroupCr(e.target.value)}   
                    required
                >
                    <option value="">Выберите группу</option>
                    {groupsCr?.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name_group}
                        </option>
                    ))}
                </select>
        
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



export { KnowledgeCreateModal }

