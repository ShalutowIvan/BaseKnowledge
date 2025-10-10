import { useState } from 'react'



// 🔥 КОМПОНЕНТ МОДАЛКИ СОХРАНЕНИЯ
function SaveTabListModal({ onClose, onSave, tabCount, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
          <h2>💾 Сохранить вкладки</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название списка *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Мои вкладки (${tabCount})`}
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
          
          <div className="modal-info">
            Будет сохранено {tabCount} вкладок
          </div>
          
          <div className="modal-actions">
            
            <button 
              type="submit" 
              disabled={!name.trim() || loading}
              className="save-button"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>

            <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
              Отмена
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}



export { SaveTabListModal }