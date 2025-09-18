import React from 'react';

const Pagination = ({ 
            currentPage, 
            totalPages, 
            onPageChange,
            hasNext,
            hasPrev 
          }) => {
  /**
   * Генерирует массив номеров страниц для отображения
   * Показывает только ближайшие 5 страниц + первую и последнюю
   */
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5; // Максимум видимых страниц
    
    // Всегда показываем первую страницу
    pages.push(1);
    
    // Вычисляем диапазон страниц вокруг текущей
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);
    
    // Корректируем диапазон если near edges
    if (currentPage <= 3) {
      endPage = Math.min(6, totalPages - 1);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 5);
    }
    
    // Добавляем многоточие после первой страницы если нужно
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Добавляем страницы в диапазоне
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Добавляем многоточие перед последней страницей если нужно
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Добавляем последнюю страницу если она не первая
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Page navigation">
      {/* Кнопка "Назад" */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className={`pagination-btn ${!hasPrev ? 'disabled' : ''}`}
      >
        ← Назад
      </button>
      
      {/* Номера страниц */}
      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          className={`pagination-btn ${currentPage === page ? 'active' : ''} ${typeof page !== 'number' ? 'ellipsis' : ''}`}
          disabled={typeof page !== 'number'}
        >
          {page}
        </button>
      ))}
      
      {/* Кнопка "Вперед" */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className={`pagination-btn ${!hasNext ? 'disabled' : ''}`}
      >
        Вперед →
      </button>
    </nav>
  );
};

export default Pagination;