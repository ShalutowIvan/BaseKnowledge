// components/KnowledgeTabs.jsx
import { useState } from 'react';

function KnowledgeTabs({ activeTabs, onCloseTab, onTabClick }) {
  if (activeTabs?.length === 0) return null;

  return (
    <div className="knowledge-tabs">
      <div className="tabs-header">
        <h3>Открытые знания</h3>
      </div>
      <div className="tabs-list">
        {activeTabs?.map((tab) => (
          <div 
            key={tab.id} 
            className={`tab-item ${tab.active ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            <button 
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { KnowledgeTabs };