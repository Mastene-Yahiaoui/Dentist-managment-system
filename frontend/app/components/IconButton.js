'use client';

export default function IconButton({
  ariaLabel,
  title,
  onClick,
  className = '',
  variant = 'ghost',
  disabled = false,
  children,
}) {
  const base = 'inline-flex items-center justify-center p-2 sm:p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-w-10 min-h-10 sm:min-w-auto sm:min-h-auto';
  const variants = {
    'ghost': 'text-gray-600 hover:text-black active:text-black focus:ring-gray-500',
    'danger-ghost': 'text-gray-600 hover:text-red-600 active:text-red-700 focus:ring-red-500',
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
