'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Check if we have a hash in the URL (implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        // Set the session with the tokens
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Session error:', error);
          router.push('/login?error=session_error');
          return;
        }

        // Get the role from localStorage
        const role = localStorage.getItem('signup_role') || 'student';

        // Update user metadata with role
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role }
        });

        if (updateError) {
          console.error('Error updating role:', updateError);
        }

        // Clear localStorage
        localStorage.removeItem('signup_role');

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // No tokens found
        router.push('/login?error=no_tokens');
      }
    } catch (error) {
      console.error('Callback error:', error);
      router.push('/login?error=callback_error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}