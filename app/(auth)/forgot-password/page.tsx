'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <Image
              src="/images/logo-icon.png"
              alt="EduLink Hub Logo"
              width={60}
              height={60}
              className="w-15 h-15 mx-auto"
            />
          </div>

          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Check Your Email
          </h1>
          <p className="text-gray-600 mb-6">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to reset your password. If you don't see it, check your spam folder.
          </p>

          <Link href="/login">
            <button className="w-full py-3 bg-[#0D9488] text-white rounded-lg font-semibold hover:bg-[#0a7a6f] transition-all text-sm">
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-icon.png"
              alt="EduLink Hub Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold">
              <span className="text-[#0D9488]">Edulink</span>
              <span className="text-gray-400">HUB</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot Password?
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          No worries! Enter your email and we'll send you reset instructions.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="@gmail.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-800 hover:to-amber-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Remember your password?{' '}
          <Link href="/login" className="text-[#0D9488] font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}