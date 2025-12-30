import React, { useState, useRef, useEffect } from 'react';

/**
 * Searchable Select Component
 * Provides a dropdown with search capability for filtering options
 */
export default function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  placeholder = 'Search and select...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  // Get the selected option's label
  const selectedOption = options.find((opt) => getOptionValue(opt) === value);
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the input when opened
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (option) => {
    const newValue = getOptionValue(option);
    onChange({
      target: {
        name,
        value: newValue,
      },
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="mb-4" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-black mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Input/Display Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-left flex justify-between items-center ${
            isOpen ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <span className={selectedLabel ? 'text-black' : 'text-gray-500'}>
            {selectedLabel || placeholder}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {/* Search Input */}
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none text-black"
            />

            {/* Options List */}
            <ul className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors text-black ${
                        getOptionValue(option) === value ? 'bg-blue-100 font-semibold' : ''
                      }`}
                    >
                      {getOptionLabel(option)}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-gray-500 text-center">No options found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
