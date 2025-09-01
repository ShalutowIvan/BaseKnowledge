import React, { useState, useRef, useEffect } from 'react';
import './CSS/DropdownMenu.css';

const DropdownMenu = ({ group, onDelete, onRename }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрытие меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(group);
    setIsOpen(false);
  };

  const handleRename = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRename(group);
    setIsOpen(false);
  };

  return (
    <div className="dropdown-menu-container" ref={dropdownRef}>
      <button 
        className="dropdown-toggle"
        onClick={handleMenuToggle}
        aria-label="Действия с группой"
      >
        <span className="dots">•••</span>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <button className="dropdown-item" onClick={handleRename}>
            Переименовать
          </button>
          <button className="dropdown-item delete" onClick={handleDelete}>
            Удалить
          </button>
        </div>
      ) }
    </div>
  );
};

export { DropdownMenu };