import React from 'react';

const LoadMoreTabListsButton = ({ 
  onClick, 
  hasMore, 
  isLoading, 
  loadedCount, 
  total 
}) => {
  
  // if (!hasMore) return null;
  // && loadedCount > 0
  if (!hasMore) {  
    return (
      <div className="load-more-section">
        <div className="end-of-list">
          🎉 Вы загрузили все {loadedCount} списков вкладок
        </div>
      </div>
    );
  }

  if (!hasMore && loadedCount === 0) {
    return (
      <div className="load-more-section">
        <div className="no-tab-lists">
          <p>Конец списка</p>
        </div>
      </div>
    );
  }

  return (
    <div className="load-more-tab-lists">
      <div className="pagination-info">
        Показано {loadedCount} из {total} списков
        </div>
        <br/>
      <button 
        onClick={onClick} 
        disabled={isLoading}
        className="toolbar-button"
      >
        {isLoading ? 'Загрузка...' : 'Загрузить еще 🢃'}        
      </button>
      
    </div>
  );
};

export {LoadMoreTabListsButton};