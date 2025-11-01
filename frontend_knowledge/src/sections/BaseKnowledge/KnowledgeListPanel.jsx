import React from 'react';
import { SearchSection } from './SearchSection';
import { TabListsSection } from './TabListsSection';
import { KnowledgeList } from './KnowledgeList';
import { PaginationSection } from './PaginationSection';

const KnowledgeListPanel = React.memo(({
  openListKnowledges,
  searchState,
  knowledgeState,
  paginationState,
  tabListsState,
  filter_change_date,
  activeTabsCount,
  
  // Обработчики
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onKeyPress,
  onSearchTypeChange,
  onPerPageChange,
  onPageChange,
  onToggleDateFilter,
  onToggleViewTabList,
  onOpenKnowledge,
  onSaveTabs,
  onShowTabsName,
  onStartEditingTabList,
  onDeleteSavedTabList,
  onOpenSavedTabList,
  onLoadMoreTabLists,
  onOpenModalCreateKnowledge
}) => {
  const { knowledges, total, loading, error } = knowledgeState;
  const { currentPage, perPage, totalPages, hasNext, hasPrev } = paginationState;
  const { savedTabLists, activeTabList, viewTabList, tabsName, loadingTabLists, hasMoreTabLists, isLoadingMoreTabLists, tabListsTotal } = tabListsState;

  console.log('KnowledgeListPanel render');

  return (
    // Левая панель со списком знаний
    <div className={`knowledges-list ${!openListKnowledges ? 'collapsed' : ''}`}>
      {/* Шапка */}
      <div className="knowledges-list-header">
        <h1>Знания</h1>
        {/* ПОИСКОВАЯ СТРОКА С КНОПКОЙ */}
        <SearchSection
          searchState={searchState}
          loading={loading}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
          onClearSearch={onClearSearch}
          onKeyPress={onKeyPress}
          onSearchTypeChange={onSearchTypeChange}
        />        

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <button className="save-button" onClick={onOpenModalCreateKnowledge}>
            Добавить знание
          </button>

          {/* Селектор количества элементов */}
          <div className="per-page-selector">
            <label>Элементов на странице:</label>
            <select value={perPage} onChange={onPerPageChange}>
              <option value="2">2</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      </div>

        {/* ИНФОРМАЦИЯ О РЕЗУЛЬТАТАХ ПОИСКА */}
      {searchState.isSearchActive && searchState.activeSearchTerm && (
        <div className="search-info">
          <p>
            Результаты поиска: "{searchState.activeSearchTerm}" · Найдено: {total} записей
            <button onClick={onClearSearch} className="search-clear-link">
              Очистить поиск
            </button>
          </p>
        </div>
      )}

        {/* Списки знаний */}
      <TabListsSection
        savedTabLists={savedTabLists}
        viewTabList={viewTabList}
        activeTabList={activeTabList}
        tabsName={tabsName}
        loadingTabLists={loadingTabLists}
        hasMoreTabLists={hasMoreTabLists}
        isLoadingMoreTabLists={isLoadingMoreTabLists}
        tabListsTotal={tabListsTotal}
        activeTabsCount={activeTabsCount}
        onToggleViewTabList={onToggleViewTabList}
        onSaveTabs={onSaveTabs}
        onShowTabsName={onShowTabsName}
        onStartEditingTabList={onStartEditingTabList}
        onDeleteSavedTabList={onDeleteSavedTabList}
        onOpenSavedTabList={onOpenSavedTabList}
        onLoadMoreTabLists={onLoadMoreTabLists}
      />

      <div>
        <br/>

        {/* Информация о пагинации */}  
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div className="pagination-info">
            Показано {knowledges.length} из {total} записей
          </div>

          <button 
            className='sort-date' 
            onClick={onToggleDateFilter} 
            disabled={loading}
          >
            {filter_change_date ? 'Дата ▲' : 'Дата ▼'}
          </button>
        </div>
        <br/>

        {/* Список знаний */}
        <KnowledgeList
          knowledges={knowledges}
          loading={loading}
          onOpenKnowledge={onOpenKnowledge}
        />
      </div>
      
      {/* Пагинация - фиксированная внизу */}
      <div className="knowledges-list-footer">
        <PaginationSection
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
});

export { KnowledgeListPanel };