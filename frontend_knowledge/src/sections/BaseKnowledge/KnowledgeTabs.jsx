import React from 'react';
import './CSS/Tabs.css';


/**
 * Компонент отображает список вкладок
 * Обернут в React.memo для предотвращения ненужных перерисовок
 * useCallback функции обеспечивают стабильность пропсов
 */
const KnowledgeTabs = React.memo(({ tabs, onCloseTab, onSwitchTab }) => {
  if (tabs.length === 0) return null;

  return (
    <div className="knowledge-tabs">
      <div className="tabs-header">
        <h3>Открытые вкладки</h3>
      </div>
      <div className="tabs-list">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab-item ${tab.active ? 'active' : ''}`}
            onClick={() => onSwitchTab(tab.id)} // Стабильная функция
          >
            <span className="tab-title" title={tab.title}>
              {tab.title}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id); // Стабильная функция
              }}
              aria-label="Закрыть вкладку"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

KnowledgeTabs.displayName = 'KnowledgeTabs';

export {KnowledgeTabs};