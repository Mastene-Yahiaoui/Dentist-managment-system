// Auth Guard Component
// Protects the main app - redirects to login if not authenticated

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Auth Guard Component
 * Wraps the main app content and redirects to login if not authenticated
 */
export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) {
      console.log('[AuthGuard] Still loading...');
      return;
    }

    console.log('[AuthGuard] Auth check complete. Authenticated:', isAuthenticated);

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log('[AuthGuard] Not authenticated, redirecting to login');
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't show children
  if (!isAuthenticated) {
    console.log('[AuthGuard] Not authenticated, returning null');
    return null;
  }

  // If authenticated, show children
  console.log('[AuthGuard] Authenticated, showing children');
  return children;
}
