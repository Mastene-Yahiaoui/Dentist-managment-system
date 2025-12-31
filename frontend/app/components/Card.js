export default function Card({ title, children, className = '', action }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
