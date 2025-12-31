// Settings Page

'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Navbar from '../components/Navbar';

export default function SettingsPage() {
  const { user, changePassword, changeEmail, loading, error } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [success, setSuccess] = useState(null);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'email'

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      setFormError('Current password and new password are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      setFormError('New password must be different from current password');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setFormError(result.error || 'Failed to change password');
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!currentPasswordForEmail) {
      setFormError('Current password is required');
      return;
    }

    if (!newEmail) {
      setFormError('New email is required');
      return;
    }

    if (newEmail === user?.email) {
      setFormError('New email must be different from current email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setFormError('Please enter a valid email address');
      return;
    }

    const result = await changeEmail(newEmail, currentPasswordForEmail);

    if (result.success) {
      setSuccess('Confirmation email sent to your new address. Please check your inbox to confirm the change.');
      setNewEmail('');
      setCurrentPasswordForEmail('');
    } else {
      setFormError(result.error || 'Failed to change email');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar title="Settings" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your account settings and preferences</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 sm:space-x-4 mb-8 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('password');
              setSuccess(null);
              setFormError(null);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => {
              setActiveTab('email');
              setSuccess(null);
              setFormError(null);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Change Email
          </button>
        </div>

        {/* Password Reset Card */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {(formError || error) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{formError || error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setFormError(null);
                  }}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setFormError(null);
                  }}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFormError(null);
                  }}
                  disabled={loading}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Email Change Card */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Change Email Address</h2>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {(formError || error) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{formError || error}</p>
              </div>
            )}

            <form onSubmit={handleEmailChange} className="space-y-4">
              {/* Current Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email Address
                </label>
                <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {user?.email}
                </div>
              </div>

              {/* Current Password for Verification */}
              <div>
                <label htmlFor="passwordForEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <Input
                  id="passwordForEmail"
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={currentPasswordForEmail}
                  onChange={(e) => {
                    setCurrentPasswordForEmail(e.target.value);
                    setFormError(null);
                  }}
                  disabled={loading}
                />
              </div>

              {/* New Email */}
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <Input
                  id="newEmail"
                  type="email"
                  required
                  placeholder="Enter your new email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setFormError(null);
                  }}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  You'll receive a confirmation email at your new address
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Change Email'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
