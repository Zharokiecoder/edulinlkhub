'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'About Us', href: '/about' },
  ];

  useEffect(() => {
    // Check current session
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null);
          fetchProfile(session?.user?.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string | undefined) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDashboard = () => {
    setIsOpen(false);
    switch (profile?.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'educator':
        router.push('/dashboard/instructor');
        break;
      case 'student':
        router.push('/dashboard/student');
        break;
      default:
        router.push('/dashboard/student');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="EduLink Hub Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold">
              <span className="text-[#0D9488]">EduLink</span>
              <span className="text-gray-700">HUB</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-[#0D9488] transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
            ) : user ? (
              // Logged in - Show Dashboard & Logout
              <>
                <button
                  onClick={handleDashboard}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#0D9488] transition-colors font-medium"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
                
                {/* User Avatar/Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <img
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name || user.email}&background=0D9488&color=fff`}
                      alt="User"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.name || 'User'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {profile?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-teal-600 mt-1 capitalize">
                        {profile?.role || 'Student'}
                      </p>
                    </div>
                    <button
                      onClick={handleDashboard}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Logged out - Show Login & Sign Up
              <>
                <Link href="/login">
                  <Button variant="primary">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="teal">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-[#0D9488] transition-colors font-medium px-4 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="flex flex-col gap-3 px-4 pt-4 border-t border-gray-100">
                {loading ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                ) : user ? (
                  // Logged in - Mobile
                  <>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name || user.email}&background=0D9488&color=fff`}
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {profile?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-teal-600 capitalize">
                          {profile?.role || 'Student'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDashboard}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#0D9488] text-white rounded-lg font-semibold hover:bg-[#0a7a6f] transition-colors"
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  // Logged out - Mobile
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="primary" className="w-full">Login</Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      <Button variant="teal" className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;