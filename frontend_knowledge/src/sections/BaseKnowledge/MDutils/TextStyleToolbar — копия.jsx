import React, { useState } from 'react';

export const TextStyleToolbar = ({ onApplyStyle }) => {
  const [fontSize, setFontSize] = useState('');
  const [fontColor, setFontColor] = useState('');

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setFontSize(size);
    if (size) {
      onApplyStyle(`<span style="font-size:${size}px">`, `</span>`);
    }
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setFontColor(color);
    if (color) {
      onApplyStyle(`<span style="color:${color}">`, `</span>`);
    }
  };

  const buttonStyle = {
    padding: '6px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'white'
  };

  return (
    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Стиль текста */}
      {/* <button style={buttonStyle} onClick={() => onApplyStyle('**')}><b>B</b></button>
      <button style={buttonStyle} onClick={() => onApplyStyle('*')}><i>I</i></button>
      <button style={buttonStyle} onClick={() => onApplyStyle('~~')}><s>S</s></button> */}

      {/* Размер шрифта */}
      <select value={fontSize} onChange={handleFontSizeChange} style={buttonStyle}>
        <option value="">Размер шрифта</option>
        <option value="12">Маленький</option>
        <option value="16">Обычный</option>
        <option value="20">Средний</option>
        <option value="24">Большой</option>
        <option value="32">Очень большой</option>
      </select>

      {/* Цвет текста */}
      <select value={fontColor} onChange={handleColorChange} style={buttonStyle}>
        <option value="">Цвет текста</option>
        <option value="black">Чёрный</option>
        <option value="red">Красный</option>
        <option value="green">Зелёный</option>
        <option value="blue">Синий</option>
        <option value="purple">Фиолетовый</option>
        <option value="orange">Оранжевый</option>
      </select>
    </div>
  );
};
