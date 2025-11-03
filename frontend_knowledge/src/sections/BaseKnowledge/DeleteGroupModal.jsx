import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/DeleteGroup.css'
import { API } from "../../apiAxios/apiAxios"


function DeleteGroupModal({ groupToDelete, onClose, onSuccess }) {  
  
  const [availableGroups, setAvailableGroups] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [hasKnowledge, setHasKnowledge] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');


  const navigate = useNavigate();

  // Проверяем есть ли знания в группе и загружаем другие группы
  useEffect(() => {
    const checkGroup = async () => {
      try {
          setIsDeleting(true)
            
          // const knowledgeRes = await API.get(`/knowledges_in_group/${groupToDelete.slug}`);          
          // const groupsRes = await API.get('/groups_all/');
          
          const [knowledgeRes, groupsRes] = await Promise.all([
            API.get(`/knowledges_in_group/${groupToDelete.slug}`),
            API.get('/groups_all/')
          ]);

          setHasKnowledge(knowledgeRes.data.items.length > 0);          
          
          const otherGroups = groupsRes.data.filter(g => g.id !== groupToDelete.id);
          setAvailableGroups(otherGroups);          
          
          if (otherGroups.length > 0) {
            setTargetGroupId(otherGroups[0].id);
          } else if (hasKnowledge) {
            setError('Нет других групп для переноса знаний');
          }
      } catch (err) {
          setError(err.message);
          console.error('Check group error:', err);
      } finally {
          setIsDeleting(false);  
      }  
    };

    if (groupToDelete) {
        checkGroup()
      };

  }, [groupToDelete]);

  const handleDelete = async () => {
    if (hasKnowledge && !targetGroupId) {
      setError('Выберите группу для переноса знаний');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await API.delete(`/group_delete/${groupToDelete.id}`, {
        data: {
          move_to_group: hasKnowledge ? targetGroupId : null
        }
      });
      onSuccess();
      onClose();
      navigate(`/knowledges/`);
    } catch (err) {
      setError(`Ошибка при удалении группы ${err.message}`);
      console.error('Delete group error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!groupToDelete) return null;

  return (
    <div className="modal-overlay">

      <div className="modal-content">        
        <h3>Удаление группы "{groupToDelete.name_group}"</h3>
        
        {hasKnowledge ? (
          <>
            <p>В этой группе есть знания. Выберите группу для их переноса:</p>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="group-select"
            >
              <option value="">Выберите группу</option>
              {availableGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name_group}
                </option>
              ))}
            </select>
            {availableGroups.length === 0 && (
              <p className="error-message">Нет доступных групп для переноса</p>
            )}
          </>
        ) : (
          <p>Вы уверены, что хотите удалить эту группу?</p>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions-group">
          <button 
            onClick={handleDelete}
            disabled={isDeleting || (hasKnowledge && !targetGroupId)}
            className="save-button"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>

          <button 
            onClick={onClose}             
            className="cancel-button"
            disabled={isDeleting}
          >
            Отмена
          </button>
          
        </div>
      </div>
    </div>
  );
}



export { DeleteGroupModal }

