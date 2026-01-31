"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Users, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  Search, 
  Bell, 
  LogOut,
  Menu,
  X,
  Award
} from 'lucide-react';

export default function InstructorDashboardLayout({ children }: { children: React.ReactNode }) {
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
  const [user, setUser] = useState<any>(null);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    checkAuthAndFetchProfile();
    
    // Refresh profile when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuthAndFetchProfile();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      console.log('Layout: Checking authentication...');
      
      // Use getSession instead of getUser
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Layout: Session error:', error);
        router.push('/login'); // Changed from /auth/login
        return;
      }
      
      if (!session) {
        console.log('Layout: No session found, redirecting to login');
        router.push('/login'); // Changed from /auth/login
        return;
      }

      console.log('Layout: User authenticated:', session.user.email);
      setUser(session.user);

      // Fetch profile data
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('name, email, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || session.user.email || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        // If no profile, use session data
        setProfile({
          name: session.user.user_metadata?.name || '',
          email: session.user.email || '',
          avatar_url: '',
        });
      }
    } catch (error) {
      console.error('Layout: Error checking auth:', error);
      router.push('/login'); // Changed from /auth/login
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login'); // Changed from /
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Overview', href: '/dashboard/instructor' },
    { icon: BookOpen, label: 'My Courses', href: '/dashboard/instructor/courses' },
    { icon: Users, label: 'Students', href: '/dashboard/instructor/students' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/instructor/schedule' },
    { icon: DollarSign, label: 'Earnings', href: '/dashboard/instructor/earnings' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/instructor/messages' },
    { icon: Settings, label: 'Settings', href: '/dashboard/instructor/settings' },
    { icon: HelpCircle, label: 'Help & Support', href: '/dashboard/instructor/help-support' },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/dashboard/instructor') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // If no user after loading, don't render anything (redirect will happen)
  if (!user) {
    return null;
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
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Award className="text-white" size={20} />
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.href)
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Get Pro Card */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
              <p className="text-xs text-white/80 mb-3">Get unlimited courses and advanced analytics</p>
              <button className="w-full px-3 py-2 bg-white text-teal-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
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
                    placeholder="Search courses, students..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  href="/dashboard/instructor/messages"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>

                {/* Profile */}
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {profile.name || user?.email?.split('@')[0] || 'Instructor'}
                    </p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                  <Link href="/dashboard/instructor/settings" className="relative group">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name || 'Instructor'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-teal-500 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-gray-200 group-hover:ring-teal-500 transition-all text-sm sm:text-base">
                        {profile.name 
                          ? profile.name.charAt(0).toUpperCase() 
                          : user?.email?.charAt(0).toUpperCase() || 'I'
                        }
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