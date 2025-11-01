import React from 'react';
import Pagination from './Pagination/Pagination';

const PaginationSection = React.memo(({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange
}) => {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      hasNext={hasNext}
      hasPrev={hasPrev}
    />
  );
});

export { PaginationSection };