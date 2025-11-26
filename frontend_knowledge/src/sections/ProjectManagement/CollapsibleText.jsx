// CollapsibleText.jsx
import { useState } from 'react';

const CollapsibleText = ({ text, maxLines = 3, className = "", style = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const needsCollapse = text && text.split('\n').length > maxLines;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const textStyle = {
    whiteSpace: 'pre-line',
    lineHeight: '1.5',
    overflow: 'hidden',
    display: needsCollapse && !isExpanded ? '-webkit-box' : 'block',
    WebkitLineClamp: needsCollapse && !isExpanded ? maxLines : 'none',
    WebkitBoxOrient: 'vertical',
    ...style
  };

  return (
    <div className={className}>
      <div style={textStyle}>
        {text}
      </div>
      {needsCollapse && (
        <button 
          onClick={toggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: '#5F9EA0',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '8px',
            textDecoration: 'underline'
          }}
        >
          {isExpanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      )}
    </div>
  );
};

export { CollapsibleText };

