'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Patients', path: '/patients' },
    { name: 'Appointments', path: '/appointments' },
    { name: 'Treatments', path: '/treatments' },
    { name: 'Invoices', path: '/invoices' },
    { name: 'Inventory', path: '/inventory' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">DentNotion</h1>
        <p className="text-sm text-gray-400 mt-1">Dental Clinic Management</p>
      </div>
      
      <nav className="mt-6 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                isActive ? 'bg-gray-900 text-white border-r-4 border-blue-500' : ''
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Menu at Bottom */}
      <div className="p-4 border-t border-gray-700">
        <UserMenu />
      </div>

      <div className="p-6 border-t border-gray-700">
        <p className="text-xs text-gray-400">© 2025 DentNotion</p>
        <p className="text-xs text-gray-500">v1.0.0</p>
      </div>
    </div>
  );
}
