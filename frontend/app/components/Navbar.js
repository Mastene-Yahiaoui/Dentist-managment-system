'use client';

export default function Navbar({ title }) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">{title}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-black">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
