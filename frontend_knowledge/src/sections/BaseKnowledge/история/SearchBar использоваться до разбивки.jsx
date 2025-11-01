import React, { memo } from 'react';



const SearchBar = React.memo(({ 
  searchTerm, 
  onSearchChange, 
  onSearchSubmit, 
  onClearSearch, 
  onKeyPress,
  searchType,
  onSearchTypeChange,
  isSearchActive,
  loading 
}) => {
  return (
    <div className="search-container">
      <div className="search-input-with-button">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Поиск по названию, описанию или содержанию..."
            value={searchTerm}
            onChange={onSearchChange}
            onKeyPress={onKeyPress}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={onClearSearch} className="search-clear-btn">
              ×
            </button>
          )}
        </div>
        <button 
          onClick={onSearchSubmit}
          disabled={!searchTerm.trim() || loading}
          className="search-submit-btn"
        >
          {/* {loading ? 'Поиск...' : 'Найти'} */}
          Найти
        </button>
      </div>
      
      {isSearchActive && (
        <div className="search-type-selector">
          <label>Тип поиска:</label>
          <select value={searchType} onChange={onSearchTypeChange}>
            <option value="plain">Обычный поиск</option>
            <option value="phrase">Точная фраза</option>
            <option value="advanced">Продвинутый поиск</option>
          </select>
          {searchType === 'advanced' && (
            <div className="search-hint">
              Используйте: & (И), | (ИЛИ), ! (НЕ)
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export {SearchBar}