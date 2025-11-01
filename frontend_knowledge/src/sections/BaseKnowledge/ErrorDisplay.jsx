

const ErrorDisplay = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '200px',    // Отступ от нижнего края
      left: '30px',      // Отступ от левого края
      background: '#ff4444',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '8px',
      zIndex: 1000,
      maxWidth: '450px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',    
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '15px'
      }}>
        <span style={{ flex: 1 }}>{error}</span>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            minWidth: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export {ErrorDisplay}