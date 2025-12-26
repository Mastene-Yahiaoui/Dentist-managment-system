// Authentication Context for managing global auth state
// Provides user info, tokens, and auth methods to the entire app

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

/**
 * Hook to use authentication context
 * @returns {Object} Auth context with user, tokens, and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Component
 * Manages auth state and provides auth methods to children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  /**
   * Restore session from localStorage on mount
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if running in browser
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const savedAccessToken = localStorage.getItem('accessToken');
        const savedRefreshToken = localStorage.getItem('refreshToken');
        const savedUser = localStorage.getItem('user');

        if (savedAccessToken && savedUser) {
          setAccessToken(savedAccessToken);
          setRefreshToken(savedRefreshToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Sign up new user
   */
  const signup = useCallback(async (email, password, fullName = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();

      // Save tokens and user to localStorage and cookies
      localStorage.setItem('accessToken', data.data.access_token);
      localStorage.setItem('refreshToken', data.data.refresh_token);
      
      // Also set cookie for middleware auth check
      document.cookie = `accessToken=${data.data.access_token}; path=/; max-age=3600`;
      
      const userData = {
        user_id: data.data.user_id,
        email: data.data.email,
        full_name: data.data.full_name,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      setAccessToken(data.data.access_token);
      setRefreshToken(data.data.refresh_token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Log in user
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();

      // Save tokens and user to localStorage and cookies
      localStorage.setItem('accessToken', data.data.access_token);
      localStorage.setItem('refreshToken', data.data.refresh_token);
      
      // Also set cookie for middleware auth check
      document.cookie = `accessToken=${data.data.access_token}; path=/; max-age=3600`;
      
      const userData = {
        user_id: data.data.user_id,
        email: data.data.email,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      setAccessToken(data.data.access_token);
      setRefreshToken(data.data.refresh_token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Refresh access token
   */
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      setError('No refresh token available');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update tokens
      localStorage.setItem('accessToken', data.data.access_token);
      localStorage.setItem('refreshToken', data.data.refresh_token);

      setAccessToken(data.data.access_token);
      setRefreshToken(data.data.refresh_token);

      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      logout(); // Clear auth if refresh fails
      return false;
    }
  }, [refreshToken, API_URL]);

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/password_reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const contentType = response.headers.get('content-type');
      let data;

      // Check if response is JSON
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, read as text
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Invalid response from server. Please check the backend.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Confirm password reset
   */
  const confirmPasswordReset = useCallback(async (email, token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/password_reset_confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          new_password: newPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data;

      // Check if response is JSON
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, read as text
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Invalid response from server. Please check the backend.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      return { success: true };
    } catch (err) {
      console.error('Password reset confirm error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Log out user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (accessToken) {
        // Notify backend
        await fetch(`${API_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }).catch(err => console.error('Logout API error:', err));
      }

      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear cookie
      document.cookie = 'accessToken=; path=/; max-age=0';

      // Clear state
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setError(null);

      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear state even if API call fails
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [accessToken, API_URL]);

  /**
   * Change password for authenticated user
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/change_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response (Status: ' + response.status + '):', text);
        throw new Error(`Server error (${response.status}): Invalid response format. Check backend logs.`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to change password');
      }

      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [accessToken, API_URL]);

  /**
   * Change email for authenticated user
   */
  const changeEmail = useCallback(async (newEmail, currentPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/change_email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_email: newEmail,
          current_password: currentPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response (Status: ' + response.status + '):', text);
        throw new Error(`Server error (${response.status}): Invalid response format. Check backend logs.`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to change email');
      }

      // Update user email in state
      if (user) {
        setUser({ ...user, email: newEmail });
        localStorage.setItem('user', JSON.stringify({ ...user, email: newEmail }));
      }

      return { success: true };
    } catch (err) {
      console.error('Change email error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [accessToken, user, API_URL]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user && !!accessToken;

  const value = {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,

    // Methods
    signup,
    login,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    changeEmail,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
