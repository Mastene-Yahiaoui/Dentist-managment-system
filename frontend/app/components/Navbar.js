'use client';

export default function Navbar({ title }) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-8 py-3 sm:py-4 mt-12 md:mt-0">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-black">{title}</h1>
        <div className="hidden sm:flex items-center text-sm text-black">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>
    </div>
  );
}
