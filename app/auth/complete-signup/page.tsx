'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CompleteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    completeSignup();
  }, []);

  const completeSignup = async () => {
    try {
      console.log('Starting Google OAuth profile setup...');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        router.push('/login');
        return;
      }

      console.log('User found:', user.id, user.email);

      // Get role from URL parameter first, then localStorage, then default to student
      const urlRole = searchParams.get('role');
      const localStorageRole = localStorage.getItem('signup_role');
      const role = urlRole || localStorageRole || 'student';
      
      console.log('Role from URL:', urlRole);
      console.log('Role from localStorage:', localStorageRole);
      console.log('Final role to use:', role);
      
      // Update user metadata with role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      } else {
        console.log('✅ User metadata updated with role:', role);
      }

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
      }

      console.log('Existing profile check:', existingProfile);

      // Create or update profile
      if (!existingProfile) {
        console.log('Creating NEW profile with role:', role);

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              role: role, // Use the role we determined above
              name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url || null,
            }
          ])
          .select()
          .single();

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          alert('Failed to create profile. Please try again or contact support.');
          router.push('/login');
          return;
        }

        console.log('✅ Profile created successfully:', newProfile);

        // Create welcome activity
        const welcomeMessage = role === 'educator' 
          ? 'Your instructor account has been created successfully. Start creating courses and teaching students.'
          : 'Your student account has been created successfully. Start exploring courses and connecting with tutors.';

        const { error: activityError } = await supabase
          .from('activities')
          .insert([
            {
              user_id: user.id,
              title: 'Welcome to EduLink Hub!',
              description: welcomeMessage,
              type: 'update'
            }
          ]);

        if (activityError) {
          console.error('Activity creation error:', activityError);
        } else {
          console.log('✅ Welcome activity created');
        }
      } else if (existingProfile.role !== role) {
        // Profile exists but role is different - update it
        console.log(`Updating profile role from ${existingProfile.role} to ${role}`);
        
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ role: role })
          .eq('id', user.id);

        if (updateProfileError) {
          console.error('Error updating profile role:', updateProfileError);
        } else {
          console.log('✅ Profile role updated successfully');
        }
      } else {
        console.log('Profile already exists with correct role:', existingProfile.role);
      }

      // Clear localStorage
      localStorage.removeItem('signup_role');

      console.log('🚀 Redirecting to dashboard based on role:', role);
      
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect based on role
      if (role === 'educator') {
        console.log('➡️  Redirecting to INSTRUCTOR dashboard...');
        router.push('/dashboard/instructor');
      } else {
        console.log('➡️  Redirecting to STUDENT dashboard...');
        router.push('/dashboard/student');
      }
    } catch (error) {
      console.error('❌ Complete signup error:', error);
      router.push('/login?error=signup_incomplete');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Completing your signup...</p>
        <p className="text-sm text-gray-500 mt-2">Setting up your profile</p>
      </div>
    </div>
  );
}

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <CompleteSignupContent />
    </Suspense>
  );
}