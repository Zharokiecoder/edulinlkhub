'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'educator'>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      // Store role in localStorage
      localStorage.setItem('signup_role', role);
      console.log('Role saved to localStorage:', role);

      // Sign up with email/password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: role,
          },
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('User created:', data.user.id);

        // Create profile in database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              role: role,
              name: formData.name,
              email: formData.email,
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setError('Account created but profile setup failed. Please contact support.');
          setLoading(false);
          return;
        }

        console.log('Profile created:', profileData);

        // Create welcome activity
        const welcomeMessage = role === 'educator' 
          ? 'Your instructor account has been created successfully. Start creating courses and teaching students.'
          : 'Your student account has been created successfully. Start exploring courses and connecting with tutors.';

        const { error: activityError } = await supabase
          .from('activities')
          .insert([
            {
              user_id: data.user.id,
              title: 'Welcome to EduLink Hub!',
              description: welcomeMessage,
              type: 'update',
            },
          ]);

        if (activityError) {
          console.error('Activity creation error:', activityError);
        }

        // Clear localStorage
        localStorage.removeItem('signup_role');

        // Redirect based on role
        if (role === 'educator') {
          router.push('/dashboard/instructor');
        } else {
          router.push('/dashboard/student');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);

      // Store role in localStorage as backup
      localStorage.setItem('signup_role', role);
      
      console.log('Starting Google OAuth with role:', role);

      // Start Google OAuth with role in redirect URL
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/complete-signup?role=${role}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setError(error.message);
        setLoading(false);
      }
      // If no error, user will be redirected to Google
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex">
        {/* Left Side - Form */}
        <div className="flex-1 p-6 lg:p-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Image
              src="/images/logo.png"
              alt="EduLink Hub Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold">
              <span className="text-[#0D9488]">EduLink</span>
              <span className="text-gray-700">HUB</span>
            </span>
          </Link>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Create your account
            </h1>
            <p className="text-sm text-gray-600">
              Join EduLink Hub and start your learning journey
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to sign up as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  role === 'student'
                    ? 'border-[#0D9488] bg-[#0D9488]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">🎓</div>
                <div className="font-semibold text-gray-900 text-sm">Student</div>
                <div className="text-xs text-gray-500">
                  Learn from experts
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('educator')}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  role === 'educator'
                    ? 'border-[#0D9488] bg-[#0D9488]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">👨‍🏫</div>
                <div className="font-semibold text-gray-900 text-sm">Educator</div>
                <div className="text-xs text-gray-500 mt-1">
                  Teach and inspire
                </div>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700 text-sm">
              {loading ? 'Signing up...' : `Sign up with Google`}
            </span>
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignup} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  placeholder="Create a password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 text-[#0D9488] border-gray-300 rounded focus:ring-[#0D9488]"
                required
                disabled={loading}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-[#0D9488] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#0D9488] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="teal"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Create Account`}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0D9488] hover:underline font-semibold">
              Log in
            </Link>
          </p>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/images/signup-bg.jpg"
            alt="Students learning"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}