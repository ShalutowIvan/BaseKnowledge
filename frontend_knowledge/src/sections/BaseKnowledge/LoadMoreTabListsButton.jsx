import React from 'react';

const LoadMoreTabListsButton = ({ 
  onClick, 
  hasMore, 
  isLoading, 
  loadedCount, 
  total 
}) => {
  
  // if (!hasMore) return null;

  if (!hasMore && loadedCount > 0) {  
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
      <button 
        onClick={onClick} 
        disabled={isLoading}
        className="load-more-button"
      >
        {isLoading ? 'Загрузка...' : `Загрузить еще (${loadedCount} из ${total})`}
      </button>
    </div>
  );
};

export {LoadMoreTabListsButton};