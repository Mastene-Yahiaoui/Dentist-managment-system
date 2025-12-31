export default function Input({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  name,
  className = ''
}) {
  return (
    <div className={`mb-4 w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-black mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm text-black placeholder-gray-500 touch-manipulation"
      />
    </div>
  );
}
