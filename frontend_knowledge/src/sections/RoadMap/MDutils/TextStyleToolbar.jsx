// src/components/TextStyleToolbar.jsx

import React from 'react';

// export const TextStyleToolbar = ({ onApplyStyle, textareaRef }) => {
export const TextStyleToolbar = ({ onApplyStyle }) => {


  const handleStyle = (styleCommand) => {    
    let openTag = '';
    let closeTag = '';

    if (styleCommand === 'sub') {
      // insertText = '<sub>текст</sub>';
      openTag = '<sub>'
      closeTag = '</sub>'
    } else if (styleCommand === 'sup') {
      // insertText = '<sup>текст</sup>';
      openTag = '<sup>'
      closeTag = '</sup>'
    } else if (styleCommand.startsWith('style=')) {
      // insertText = `<span ${styleCommand}>текст</span>`;
      openTag = `<span ${styleCommand}>`
      closeTag = '</span>'
    }

    // onApplyStyle(insertText);
    onApplyStyle(openTag, closeTag);
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
      <select onChange={(e) => handleStyle(`style="font-size:${e.target.value}px"`)} style={buttonStyle}>
        <option value="">Размер шрифта</option>
        <option value="12">12</option>
        <option value="16">16</option>
        <option value="20">20</option>
        <option value="24">24</option>
        <option value="32">32</option>
      </select>

      <select onChange={(e) => handleStyle(`style="font-family:${e.target.value}"`)} style={buttonStyle}>
        <option value="">Название шрифта</option>
        <option value="Arial">Arial</option>
        <option value="Calibri">Calibri</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </select>

      <select onChange={(e) => handleStyle(`style="color:${e.target.value}"`)} style={buttonStyle}>
        <option value="">Цвет текста</option>
        <option value="black">Черный</option>
        <option value="red">Красный</option>
        <option value="blue">Синий</option>
        <option value="green">Зелёный</option>
      </select>

      <select onChange={(e) => handleStyle(`style="background-color:${e.target.value}"`)} style={buttonStyle}>
        <option value="">Цвет выделения</option>
        <option value="black">Черный</option>
        <option value="red">Красный</option>
        <option value="blue">Синий</option>
        <option value="green">Зелёный</option>
      </select>

      <select onChange={(e) => handleStyle(`style="text-align:${e.target.value}"`)} style={buttonStyle}>
        <option value="">Выравнивание</option>
        <option value="left">По левому краю</option>
        <option value="center">По центру</option>
        <option value="right">По правому краю</option>
        <option value="justify">По ширине</option>
      </select>

      <select onChange={(e) => handleStyle(`style="line-height:${e.target.value}"`)} style={buttonStyle}>
        <option value="">Межстрочный интервал</option>
        <option value="1">1</option>
        <option value="1.5">1.5</option>
        <option value="2">2</option>
        <option value="2.5">2.5</option>
      </select>

      <select onChange={(e) => handleStyle(`style="${e.target.value}"`)} style={buttonStyle}>
        <option value="">Шрифт</option>
        <option value="font-weight: bold;">Жирный</option>
        <option value="font-style: italic;">Курсив</option>
        <option value="text-decoration: underline;">Подчеркнутый</option>
        <option value="text-decoration: line-through;">Зачеркнутый</option>
        
      </select>

      <button onClick={() => handleStyle('sub')} style={buttonStyle}>Подстрочный</button>
      <button onClick={() => handleStyle('sup')} style={buttonStyle}>Надстрочный</button>
    </div>
  );
};
