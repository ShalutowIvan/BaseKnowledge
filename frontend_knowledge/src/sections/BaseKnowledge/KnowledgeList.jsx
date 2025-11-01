import React from 'react';

const KnowledgeList = React.memo(({ knowledges, onOpenKnowledge, loading }) => {  

  if (knowledges.length === 0 && !loading) {
    return <div className="no-data">Нет данных для отображения</div>;
  }

  return (
    <>
        {/* Список знаний */}
      {knowledges.map((knowledge) => (
        <div key={knowledge.id}>
          <div className="section-frame">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 className="name-knowledge">{knowledge.title}</h3>
              <span style={{ fontSize: '18px', color: '#5F9EA0' }}>
                Дата изменения: {new Date(knowledge.updated_at).toLocaleString('ru-RU')}
              </span>
            </div>
            <p>Описание: {knowledge.description}</p>

            {knowledge.relevance_score !== undefined && (
              <div className="relevance-badge">
                Релевантность: {(knowledge.relevance_score * 100).toFixed(1)}%
              </div>
            )}

            <button 
              onClick={() => onOpenKnowledge(knowledge)} 
              className="toolbar-button"
            >
              Открыть
            </button>
          </div>
          <br/>
        </div>
      ))}
    </>
  );
});

export { KnowledgeList };