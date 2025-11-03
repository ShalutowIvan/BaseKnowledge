import React from 'react';
import {KnowledgeTabs} from './KnowledgeTabs';
import {KnowledgeOpenContent} from './KnowledgeOpenContent';
import { ErrorDisplay } from './ErrorDisplay'

const KnowledgeTabsPanel = React.memo(({
  error,
  tabs,
  activeTab,
  onCloseTab,
  onSwitchTab,
  onUpdate,
  onDelete,  
}) => {
  console.log('KnowledgeTabsPanel render');

  // if ( error ) {
  //   return (
  //   <div>    
  //     <p>Кузя</p>
  //   </div>
  //   )
  // }

  return (
    <div className="knowledge-tabs-container">
      {/*<ErrorDisplay 
          error={error} 
          onClose={() => setError(null)} 
        />  */}
      
      <KnowledgeTabs
        tabs={tabs}
        onCloseTab={onCloseTab}
        onSwitchTab={onSwitchTab}
      />

      <br/>

      <div className="knowledge-content-area">
        {activeTab ? (
          <KnowledgeOpenContent
            knowledge={activeTab.knowledge}
            onCloseTab={onCloseTab}
            onUpdate={onUpdate}
            onDeleteKnowledge={onDelete}            
          />
        ) : (
          <div className="no-content-message">
            <h2>Выберите знание для просмотра</h2>
          </div>
        )}
      </div>
    </div>
  );
}
);

export { KnowledgeTabsPanel };