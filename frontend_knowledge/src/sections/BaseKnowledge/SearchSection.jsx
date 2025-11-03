import React from 'react';

const SearchSection = React.memo(({
  searchState,
  loading,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onKeyPress,
  onSearchTypeChange
}) => {
  
  return (
    <div className="search-container">
      <div className="search-input-with-button">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Поиск по названию, описанию или содержанию..."
            value={searchState.searchTerm}
            onChange={onSearchChange}
            onKeyPress={onKeyPress}
            className="search-input"
          />
          {searchState.searchTerm && (
            <button onClick={onClearSearch} className="search-clear-btn">
              ×
            </button>
          )}
        </div>
        <button 
          onClick={onSearchSubmit}
          disabled={!searchState.searchTerm.trim() || loading}
          className="search-submit-btn"
        >          
          Найти
        </button>
      </div>
      
      {searchState.isSearchActive && (
        <div className="search-type-selector">
          <label>Тип поиска:</label>
          <select value={searchState.searchType} onChange={onSearchTypeChange}>
            <option value="plain">Обычный поиск</option>
            <option value="phrase">Точная фраза</option>
            <option value="advanced">Продвинутый поиск</option>
          </select>
          {searchState.searchType === 'advanced' && (
            <div className="search-hint">
              Используйте: & (И), | (ИЛИ), ! (НЕ)
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export {SearchSection};