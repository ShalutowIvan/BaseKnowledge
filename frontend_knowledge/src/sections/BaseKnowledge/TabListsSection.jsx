import React from 'react';
import {LoadMoreTabListsButton} from './LoadMoreTabListsButton';
import {ArrowIcon} from './ArrowIcon';

const TabListsSection = React.memo(({
  savedTabLists,
  viewTabList,
  activeTabList,
  tabsName,
  loadingTabLists,
  hasMoreTabLists,
  isLoadingMoreTabLists,
  tabListsTotal,
  activeTabsCount,
  
  onToggleViewTabList,
  onSaveTabs,
  onShowTabsName,
  onStartEditingTabList,
  onDeleteSavedTabList,
  onOpenSavedTabList,
  onLoadMoreTabLists
}) => {
  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>   
        <h3>📚 Cписки вкладок</h3>
        
        {/* КНОПКА СОХРАНЕНИЯ ТЕКУЩИХ ВКЛАДОК */}        
        {activeTabsCount > 0 && (
          <div>
            <button 
              className="save-button"
              onClick={onSaveTabs}
            >
              Сохранить открытые вкладки ({activeTabsCount})
            </button>
          </div>
        )}

        <button className="toolbar-button" onClick={onToggleViewTabList}>
          {viewTabList ? 'Свернуть 🢁' : 'Посмотреть 🢃'}
        </button>
      </div>
        
        {/* СПИСОК СОХРАНЕННЫХ ВКЛАДОК */}
      {viewTabList && (
        <div className="saved-tab-lists-section">
          {loadingTabLists ? (
            <div className="loading-tab-lists">Загрузка списков...</div>
          ) : (
            <>
              {savedTabLists.map(tabList => (
                <div 
                  key={tabList.id} 
                  className={`saved-tab-list-item ${activeTabList === tabList.id ? 'active' : ''}`}
                >
                  <div className="tab-list-header">
                    <div className="tab-list-title">
                      <strong>{tabList.name}</strong>
                      {activeTabList === tabList.id && (
                        <>
                          <span className="active-badge">● Открыт</span>
                          <br/>
                          
                          <button 
                            className="toggle-button" 
                            onClick={(event) => onShowTabsName(tabList.id, event)}
                          >
                            Содержание<ArrowIcon isOpen={tabList.viewListTab} />
                          </button>
                          {tabList.viewListTab && (
                            <>
                              {tabsName.map((item, index) => (
                                <div key={index}>- {item}</div>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="tab-list-actions">
                      <button 
                        className="edit-tab-list-btn"
                        onClick={(e) => onStartEditingTabList(tabList, e)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-tab-list-btn"
                        onClick={(e) => onDeleteSavedTabList(tabList.id, e)}
                        title="Удалить список"                       
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {tabList.description && (
                    <div className="tab-list-desc">{tabList.description}</div>
                  )}

                  <div className="tab-list-info">
                    <span>🕒 {new Date(tabList.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>

                  <button onClick={() => onOpenSavedTabList(tabList.id)}>
                    Открыть
                  </button>
                </div>
              ))}
              
                {/* КНОПКА "ЗАГРУЗИТЬ ДАЛЬШЕ" ДЛЯ СПИСКОВ ВКЛАДОК */}
              <LoadMoreTabListsButton
                onClick={onLoadMoreTabLists}
                hasMore={hasMoreTabLists}
                isLoading={isLoadingMoreTabLists}
                loadedCount={savedTabLists.length}
                total={tabListsTotal}
              />
              
              {savedTabLists.length === 0 && (
                <div className="no-tab-lists">
                  <p>Нет сохраненных списков знаний</p>
                  <small>Сохраните открытые знания, чтобы быстро возвращаться к ним</small>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
});

export { TabListsSection };