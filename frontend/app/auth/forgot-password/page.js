// Forgot Password Page Component

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestPasswordReset, confirmPasswordReset, loading, error: authError } = useAuth();
  
  const [step, setStep] = useState('request'); // 'request' | 'confirm'
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmData, setConfirmData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Extract token from URL on mount
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    // If token is in URL and it's a recovery type, go to confirm step
    if (token && type === 'recovery') {
      setConfirmData(prev => ({
        ...prev,
        token: token,
      }));
      setStep('confirm');
    }
  }, [searchParams]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccess('Password reset email sent! Check your email for instructions.');
      setStep('confirm');
      setError(null);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!confirmData.token || !confirmData.newPassword) {
      setError('Token and new password are required');
      return;
    }

    if (confirmData.newPassword !== confirmData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (confirmData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await confirmPasswordReset(
      email,
      confirmData.token,
      confirmData.newPassword
    );

    if (result.success) {
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      setError(result.error || 'Failed to reset password');
    }
  };

  const handleConfirmChange = (e) => {
    const { name, value } = e.target;
    setConfirmData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">DentNotion</h1>
            <p className="text-gray-600 mt-2">Dental Clinic Management System</p>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600 mb-6">
            {step === 'request'
              ? 'Enter your email to receive password reset instructions'
              : 'Enter the reset token and your new password'}
          </p>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error || authError}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Request Form */}
          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </form>
          )}

          {/* Confirm Form */}
          {step === 'confirm' && (
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="confirmEmail"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the email address for this account
                </p>
              </div>

              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Token
                </label>
                <Input
                  id="token"
                  name="token"
                  type="text"
                  required
                  placeholder="Enter token from email"
                  value={confirmData.token}
                  onChange={handleConfirmChange}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy the token from the password reset email
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={confirmData.newPassword}
                  onChange={handleConfirmChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmData.confirmPassword}
                  onChange={handleConfirmChange}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <p className="mt-6 text-center text-sm text-gray-600">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
