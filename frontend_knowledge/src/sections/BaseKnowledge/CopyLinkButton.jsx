import { useState } from 'react';

const CopyLinkButton = ({ textUrl }) => {
  const [isCopied, setIsCopied] = useState(false);
  const linkToCopy = "https://example.com/your-link";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Сброс через 2 секунды
    } catch (err) {
      console.error('Ошибка при копировании: ', err);
      // Fallback для старых браузеров
      fallbackCopyToClipboard(textUrl);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button 
      onClick={copyToClipboard}
      style={{
        padding: '8px 12px',
        backgroundColor: isCopied ? '#2E8B57' : '#2196F3',
        color: '#E0FFFF',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {isCopied ? 'Скопировано!' : 'Копировать ссылку'}
    </button>
  );
};

export { CopyLinkButton };