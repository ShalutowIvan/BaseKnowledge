import { useState } from 'react'



// 🔥 КОМПОНЕНТ МОДАЛКИ РЕДАКТИРОВАНИЯ
function EditTabListModal({ tabList, onClose, onSave, loading }) {
  const [name, setName] = useState(tabList.name);
  const [description, setDescription] = useState(tabList.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>✏️ Редактировать список</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название списка *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательное описание..."
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={!name.trim() || loading}
              className="save-button"
            >
              {loading ? 'Сохранение...' : 'Обновить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





export { EditTabListModal }