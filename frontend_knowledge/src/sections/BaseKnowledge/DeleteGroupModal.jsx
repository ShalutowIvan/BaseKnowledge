import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/DeleteGroup.css'



function DeleteGroupModal({ 
  groupToDelete, 
  onClose, 
  onSuccess 
}) {
  const [groups, setGroups] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [hasKnowledge, setHasKnowledge] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');


  const navigate = useNavigate();


  // Проверяем есть ли знания в группе и загружаем другие группы
  useEffect(() => {
    const checkGroup = async () => {
      try {
        // Проверяем есть ли знания в группе
        const knowledgeRes = await axios.get(`http://127.0.0.1:8000/knowledges_in_group/${groupToDelete.slug}`);
        // groupToDelete это объект? groupToDelete берется из select формы в другом компоненте формы
        
        setHasKnowledge(knowledgeRes.data.length > 0);
        
        // Загружаем список всех групп (кроме текущей) в состояние
        const groupsRes = await axios.get('http://127.0.0.1:8000/groups_all/');
        setGroups(groupsRes.data.filter(g => g.id !== groupToDelete.id));
        
        // Устанавливаем первую группу как выбранную по умолчанию в select поле
        if (groupsRes.data.length > 1) {
          setTargetGroupId(groupsRes.data.find(g => g.id !== groupToDelete.id)?.id || '');
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      }
    };

    if (groupToDelete) checkGroup();
  }, [groupToDelete]);

  const handleDelete = async () => {
    if (hasKnowledge && !targetGroupId) {
      setError('Выберите группу для переноса знаний');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await axios.delete(`http://127.0.0.1:8000/group_delete/${groupToDelete.id}`, {
        data: {
          move_to_group: hasKnowledge ? targetGroupId : null
        }
      });
      onSuccess();
      onClose();
      navigate(`/knowledges/`);
    } catch (err) {
      setError('Ошибка при удалении группы');
      console.error(err);
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
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name_group}
                </option>
              ))}
            </select>
          </>
        ) : (
          <p>Вы уверены, что хотите удалить эту группу?</p>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button 
            onClick={handleDelete}
            disabled={isDeleting || (hasKnowledge && !targetGroupId)}
            className="save-button"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>

          <button 
            onClick={onClose} 
            disabled={isDeleting}
            className="cancel-button"
          >
            Отмена
          </button>
          
        </div>
      </div>
    </div>
  );
}



export { DeleteGroupModal }

