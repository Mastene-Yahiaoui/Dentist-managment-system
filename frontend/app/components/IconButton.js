'use client';

export default function IconButton({
  ariaLabel,
  title,
  onClick,
  className = '',
  variant = 'ghost', // 'ghost' or 'danger-ghost'
  disabled = false,
  children,
}) {
  const base = 'inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    'ghost': 'text-gray-600 hover:text-black focus:ring-gray-500',
    'danger-ghost': 'text-gray-600 hover:text-red-600 focus:ring-red-500',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
