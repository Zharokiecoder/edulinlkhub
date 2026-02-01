"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen, 
  Award, 
  Bell, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  Search, 
  LogOut,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    checkAuthAndFetchProfile();
    
    // Set up auth state listener
   const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session) {
        fetchProfile();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }
      
      if (!session) {
        console.log('No active session - redirecting to login');
        router.push('/login');
        return;
      }

      setAuthChecked(true);
      await fetchProfile();
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Use session data as fallback
        setProfile({
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          email: session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || '',
        });
      } else if (data) {
        setProfile({
          name: data.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          email: data.email || session.user.email || '',
          avatar_url: data.avatar_url || session.user.user_metadata?.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      router.push('/login');
    }
  };

  const menuItems = [
    { icon: Home, label: 'Overview', href: '/dashboard/student' },
    { icon: Users, label: 'Tutors', href: '/dashboard/student/tutors' },
    { icon: BookOpen, label: 'Learning', href: '/dashboard/student/learning' },
    { icon: Award, label: 'Certification', href: '/dashboard/student/certification' },
    { icon: Bell, label: 'Notifications', href: '/dashboard/student/notifications' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/student/messages' },
    { icon: Settings, label: 'Settings', href: '/dashboard/student/settings' },
    { icon: HelpCircle, label: 'Help & Support', href: '/dashboard/student/help-support' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/student') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col h-full
        `}>
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900">EduLink</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation - No scroll, all items visible */}
          <nav className="flex-1 p-4 space-y-1 flex flex-col">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.href)
                    ? 'bg-cyan-50 text-cyan-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            
            {/* Logout Button - After Help & Support */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </nav>

          {/* Get Pro Card */}
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div className="bg-linear-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
              <p className="text-xs text-white/80 mb-3">Unlock all courses and features</p>
              <button className="w-full px-3 py-2 bg-white text-cyan-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>

              {/* Search Bar - Hidden on small screens */}
              <div className="hidden md:block flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Side Icons */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile Search Icon */}
                <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Search size={20} className="text-gray-600" />
                </button>

                {/* Notifications */}
                <Link 
                  href="/dashboard/student/notifications"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>

                {/* Profile */}
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{profile.name || 'Student'}</p>
                    <p className="text-xs text-gray-500">Student</p>
                  </div>
                  <Link href="/dashboard/student/settings" className="relative group">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name || 'Student'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-cyan-500 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-gray-200 group-hover:ring-cyan-500 transition-all text-sm sm:text-base">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content - Scrollable with Mobile Padding */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}