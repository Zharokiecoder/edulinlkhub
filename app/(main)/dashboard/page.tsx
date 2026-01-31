'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    redirectToDashboard();
  }, []);

  const redirectToDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('User metadata:', user.user_metadata);

      // Get profile from database (use maybeSingle to handle missing profiles)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      console.log('Profile from database:', profile);

      if (!profile) {
        console.log('Profile not found, redirecting to complete profile setup...');
        router.push('/auth/complete-signup');
        return;
      }

      // Use profile role (most reliable)
      const role = profile.role;
      console.log('Redirecting based on profile role:', role);

      // Redirect based on profile role
      if (role === 'educator') {
        console.log('Going to instructor dashboard');
        router.push('/dashboard/instructor');
      } else {
        console.log('Going to student dashboard');
        router.push('/dashboard/student');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
