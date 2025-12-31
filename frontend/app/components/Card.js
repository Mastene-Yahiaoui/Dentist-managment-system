export default function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
      {title && <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{title}</h2>}
      {children}
    </div>
  );
}
