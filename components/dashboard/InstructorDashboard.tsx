'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, ChevronDown, Menu, Home, Users, BookOpen, Award, 
  MessageSquare, Settings, HelpCircle, LogOut, Plus, Calendar, 
  DollarSign, Star, Clock, Video, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function InstructorDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Overview');
  const [loading, setLoading] = useState(true);
  
  // State for dashboard data
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    totalEarnings: 0,
    averageRating: 0
  });
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);

  const menuItems = [
    { icon: Home, label: 'Overview', active: true },
    { icon: BookOpen, label: 'My Courses', active: false },
    { icon: Users, label: 'Students', active: false },
    { icon: Calendar, label: 'Schedule', active: false },
    { icon: DollarSign, label: 'Earnings', active: false },
    { icon: MessageSquare, label: 'Messages', active: false },
    { icon: Award, label: 'Certificates', active: false },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user.id)
        .eq('status', 'active');

      // Fetch today's classes
      const today = new Date().toISOString().split('T')[0];
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('instructor_id', user.id)
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (!classesError) {
        setTodayClasses(classesData || []);
      }

      // Fetch recent enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:profiles!enrollments_student_id_fkey(name, avatar_url),
          course:courses(title)
        `)
        .eq('instructor_id', user.id)
        .order('enrolled_at', { ascending: false })
        .limit(4);

      if (!enrollmentsError) {
        setRecentEnrollments(enrollmentsData || []);
      }

      // Fetch top courses
      const { data: coursesData, error: coursesErr } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .eq('status', 'active')
        .order('total_students', { ascending: false })
        .limit(3);

      if (!coursesErr) {
        setTopCourses(coursesData || []);
      }

      // Update stats
      setStats({
        totalStudents: profileData?.total_students || 0,
        activeCourses: coursesCount || 0,
        totalEarnings: profileData?.total_earnings || 0,
        averageRating: profileData?.average_rating || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCreateCourse = () => {
    router.push('/dashboard/instructor/courses/create');
  };

  const handleViewCourses = () => {
    router.push('/dashboard/instructor/courses');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsConfig = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Active Courses', value: stats.activeCourses, icon: BookOpen, color: 'bg-green-500', change: `+${stats.activeCourses}` },
    { label: 'Total Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'bg-purple-500', change: '+18%' },
    { label: 'Avg. Rating', value: stats.averageRating.toFixed(1), icon: Star, color: 'bg-orange-500', change: '+0.2' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-sm">EH</div>
            </div>
            <span className="text-xl font-bold">
              <span className="text-cyan-500">Edulink</span>
              <span className="text-gray-400">HUB</span>
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveMenu(item.label);
                if (item.label === 'My Courses') {
                  handleViewCourses();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.label === activeMenu
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
            <ChevronDown size={16} className="ml-auto" />
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100">
            <HelpCircle size={20} />
            <span className="font-medium">Help & Support</span>
          </button>
        </nav>

        {/* Get Pro Card */}
        <div className="p-4">
          <div className="bg-linear-to-br from-purple-600 via-purple-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full opacity-20 -mr-16 -mt-16"></div>
            <div className="relative">
              <p className="text-sm mb-4">Upgrade to Pro and unlock premium features</p>
              <button className="w-full bg-white text-purple-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>

        {/* Log Out */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={20} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600"
              >
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {profile?.name}!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 w-80">
                <Search size={20} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search students, courses..."
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>

              {/* Notifications */}
              <button className="relative">
                <Bell size={24} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src={profile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt="Instructor"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{profile?.name || 'Instructor'}</p>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Actions */}
          <div className="mb-6 flex gap-3">
            <button 
              onClick={handleCreateCourse}
              className="flex items-center gap-2 bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
            >
              <Plus size={20} />
              Create Course
            </button>
            <button className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
              <Calendar size={20} />
              Schedule Class
            </button>
            <button className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
              <Video size={20} />
              Start Live Session
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statsConfig.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon size={24} className="text-white" />
                  </div>
                  <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[65, 45, 80, 55, 70, 85, 75].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-linear-to-t from-cyan-500 to-cyan-400 rounded-t-lg hover:from-cyan-600 hover:to-cyan-500 transition-all cursor-pointer"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Classes */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Today&apos;s Classes</h3>
                  <button className="text-sm text-cyan-500 hover:text-cyan-600 font-semibold">View All</button>
                </div>
                {todayClasses.length > 0 ? (
                  <div className="space-y-4">
                    {todayClasses.map((cls, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                            <Video size={24} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{cls.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(cls.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Users size={14} />
                                {cls.total_students} students
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold">
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No classes scheduled for today</p>
                    <button className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
                      Schedule a Class
                    </button>
                  </div>
                )}
              </div>

              {/* Top Courses */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Top Performing Courses</h3>
                  <button 
                    onClick={handleViewCourses}
                    className="text-sm text-cyan-500 hover:text-cyan-600 font-semibold"
                  >
                    View All
                  </button>
                </div>
                {topCourses.length > 0 ? (
                  <div className="space-y-4">
                    {topCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-cyan-300 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Users size={14} />
                              {course.total_students} students
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Star size={14} className="fill-yellow-400 text-yellow-400" />
                              {course.average_rating.toFixed(1)}
                            </span>
                            <span className="text-sm font-semibold text-green-600">${course.total_revenue.toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {course.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No courses yet</p>
                    <button 
                      onClick={handleCreateCourse}
                      className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold"
                    >
                      Create Your First Course
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Recent Students */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Enrollments</h3>
                  <button className="text-sm text-cyan-500 hover:text-cyan-600 font-semibold">View All</button>
                </div>
                {recentEnrollments.length > 0 ? (
                  <div className="space-y-4">
                    {recentEnrollments.map((enrollment, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <img
                          src={enrollment.student?.avatar_url || `https://ui-avatars.com/api/?name=${enrollment.student?.name}&background=random`}
                          alt={enrollment.student?.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{enrollment.student?.name}</p>
                          <p className="text-xs text-gray-500">{enrollment.course?.title}</p>
                          <p className="text-xs text-gray-400">{new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No recent enrollments</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-linear-to-br from-cyan-500 to-teal-500 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">New Students</span>
                    <span className="text-xl font-bold">+{stats.totalStudents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Hours Taught</span>
                    <span className="text-xl font-bold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Completion Rate</span>
                    <span className="text-xl font-bold">0%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-900">Welcome to EduLink Hub!</p>
                      <p className="text-xs text-gray-500">Start by creating your first course</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}