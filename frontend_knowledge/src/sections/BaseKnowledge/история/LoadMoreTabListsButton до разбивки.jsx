


// 🔥 КОМПОНЕНТ КНОПКИ "ЗАГРУЗИТЬ ДАЛЬШЕ" ДЛЯ СПИСКОВ ВКЛАДОК
const LoadMoreTabListsButton = ({ onClick, hasMore, isLoading, loadedCount, total }) => {
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
    <div className="load-more-section">
      <button 
        className={`load-more-button ${isLoading ? 'loading' : ''}`}
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            Загрузка списков...
          </>
        ) : (
          <>
            📥 Загрузить еще списки
          </>
        )}
      </button>
      
      {!isLoading && hasMore && (
        <div className="load-more-hint">
          Еще доступно списков для загрузки {total - loadedCount}
        </div>
      )}
    </div>
  );
};



export { LoadMoreTabListsButton }