

const ArrowIcon = ({ isOpen = false, size = 20, color = "currentColor" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isOpen ? (
        /* Стрелка вверх */
        <path d="m18 15-6-6-6 6" />
      ) : (
        /* Стрелка вниз */
        <path d="m6 9 6 6 6-6" />
      )}
    </svg>
  );
};

export { ArrowIcon }