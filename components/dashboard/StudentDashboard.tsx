'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, Bell, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentDashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for dashboard data
  const [profile, setProfile] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [featuredTutors, setFeaturedTutors] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // ✅ Form filter state
  const [filterSubject, setFilterSubject] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterSpeciality, setFilterSpeciality] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterNativeSpeaker, setFilterNativeSpeaker] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [courseOptions, setCourseOptions] = useState<{ title: string; instructor_id: string }[]>([]);

  // Available time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
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
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        router.push('/auth/complete-signup');
        return;
      }

      if (!profileData) {
        router.push('/auth/complete-signup');
        return;
      }

      setProfile(profileData);

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: true });

      if (!appointmentsError) {
        setAppointments(appointmentsData || []);
      }

      // Fetch enrolled courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles!courses_instructor_id_fkey(name, avatar_url)
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'active');

      if (!enrollmentsError) {
        setEnrolledCourses(enrollmentsData || []);
      }

      // Fetch all courses to populate dropdown
      const { data: allCourses } = await supabase
        .from('courses')
        .select('title, instructor_id');
      if (allCourses) {
        setCourseOptions(allCourses);
      }

      // Fetch recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!activitiesError) {
        setActivities(activitiesData || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetches tutors - filters by course subject via the courses table
  const fetchTutors = async (applyFilters: boolean = false) => {
    try {
      let tutorsData: any[] = [];

      if (applyFilters && filterSubject) {
        // filterSubject is now an exact course title — find its instructor directly
        const matchedCourse = courseOptions.find(c => c.title === filterSubject);

        if (!matchedCourse) {
          setFeaturedTutors([]);
          return;
        }

        // Fetch the instructor for that course
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', matchedCourse.instructor_id);

        tutorsData = data || [];
      } else {
        // No subject filter — fetch all educators
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'educator')
          .limit(5);

        tutorsData = data || [];
      }

      // Filter by keyword in JS (name or bio match)
      if (applyFilters && searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        tutorsData = tutorsData.filter((t: any) =>
          t.name?.toLowerCase().includes(kw) ||
          t.bio?.toLowerCase().includes(kw)
        );
      }

      // Attach course count to each tutor
      const tutorsWithCourses = await Promise.all(
        tutorsData.map(async (tutor: any) => {
          const { count } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', tutor.id);

          return {
            ...tutor,
            coursesCount: count || 0
          };
        })
      );

      setFeaturedTutors(tutorsWithCourses);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    }
  };

  // ✅ Called when "Personalize my result" is clicked
  const handlePersonalize = async () => {
    setIsFiltered(true);
    await fetchTutors(true);
  };

  // ✅ Resets all filters and reloads tutors
  const handleClearFilters = async () => {
    setFilterSubject('');
    setFilterPrice('');
    setFilterCountry('');
    setFilterAvailability('');
    setFilterSpeciality('');
    setFilterLanguage('');
    setFilterNativeSpeaker('');
    setFilterCategory('');
    setSearchKeyword('');
    setIsFiltered(false);
    await fetchTutors(false);
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selected >= today) {
      setSelectedDate(selected);
      setShowAppointmentModal(true);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasAppointment = (day: number) => {
    return appointments.some((apt: any) => {
      const aptDate = new Date(apt.date + 'T00:00:00');
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === month &&
        aptDate.getFullYear() === year
      );
    });
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateString = selectedDate.toISOString().split('T')[0];

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          student_id: user.id,
          date: dateString,
          time: selectedTime,
          status: 'pending',
        })
        .select()
        .single();

      if (appointmentError) {
        alert('Failed to book appointment. Please try again.');
        return;
      }

      setAppointments([...appointments, newAppointment]);
      
      await supabase.from('activities').insert({
        user_id: user.id,
        title: 'Appointment Scheduled',
        description: `Appointment booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
        type: 'appointment'
      });

      setShowAppointmentModal(false);
      setSelectedTime('');
      alert('Appointment booked successfully! ✅');
      
      await fetchDashboardData();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&h=400&fit=crop"
            alt="Learning"
            className="w-full h-64 object-cover"
          />
          <div className="p-8 text-center">
            <p className="text-teal-600 text-sm font-medium mb-2">over 100+ mentors available</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Start your learning journey with the<br />best tutor for you
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">I want to Learn</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((course, i) => (
                    <option key={i} value={course.title}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">Price per lesson</label>
                <select
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Price</option>
                  <option value="$20 - $50">$20 - $50</option>
                  <option value="$50 - $100">$50 - $100</option>
                  <option value="$100+">$100+</option>
                </select>
              </div>
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">Country</label>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Country</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">I'm Available</label>
                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Availability</option>
                  <option value="Any time">Any time</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePersonalize}
                  className="w-full py-2 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>✓</span>
                  Personalize my result
                </button>
              </div>
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">Specialities</label>
                <select
                  value={filterSpeciality}
                  onChange={(e) => setFilterSpeciality(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">Also speaks</label>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">Native Speaker</label>
                <select
                  value={filterNativeSpeaker}
                  onChange={(e) => setFilterNativeSpeaker(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-left text-xs text-gray-600 mb-1">Tutor categories</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  <option value="Professional">Professional</option>
                  <option value="Community">Community</option>
                </select>
              </div>
            </div>

            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
              <Search size={20} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search Key Words"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {isFiltered ? 'Personalized Tutors' : 'Featured Tutors'}
            </h3>
            <div className="flex items-center gap-3">
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
              <Link href="/dashboard/student/tutors" className="text-sm text-gray-600 hover:text-gray-900">See all</Link>
            </div>
          </div>

          {featuredTutors.length > 0 ? (
            <div className="space-y-6">
              {featuredTutors.map((tutor, index) => (
                <div key={index} className="flex gap-6">
                  <img
                    src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${tutor.name}&background=random`}
                    alt={tutor.name}
                    className="w-48 h-64 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-2xl font-bold text-gray-900">{tutor.name}</h4>
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      {tutor.country && <span className="text-sm text-gray-500">{tutor.country}</span>}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-medium">
                        {tutor.qualification || 'Professional'}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${tutor.hourly_rate || '40'}
                      </span>
                      <span className="text-gray-600">/50 min Lesson</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-2">
                      {tutor.bio || `Expert ${tutor.subject || 'tutor'} with ${tutor.experience || 'years'} of teaching experience.`}
                    </p>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-gray-500">
                        ⭐ {tutor.average_rating?.toFixed(1) || '5.0'} ({tutor.total_reviews || 0} reviews)
                      </span>
                      <span className="text-sm text-gray-500">
                        👥 {tutor.total_students || 0} students
                      </span>
                      <span className="text-sm text-gray-500">
                        📚 {tutor.coursesCount} courses
                      </span>
                    </div>
                    <button className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold">
                      Book Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {isFiltered ? 'No tutors match your criteria. Try adjusting your filters.' : 'Select a course above and click "Personalize my result" to find tutors'}
              </p>
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm text-cyan-600 hover:text-cyan-800 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {enrolledCourses.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">My Courses</h3>
              <Link href="/dashboard/student/learning" className="text-sm text-gray-600 hover:text-gray-900">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((enrollment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-2">{enrollment.course?.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Instructor: {enrollment.course?.instructor?.name}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{enrollment.progress}% Complete</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Calendar & Activities */}
      <div className="w-80 space-y-6">
        {/* Interactive Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={previousMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {[...Array(startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const past = isPastDate(day);
              const today = isToday(day);
              const selected = isSelected(day);
              const hasApt = hasAppointment(day);

              return (
                <button
                  key={day}
                  onClick={() => !past && handleDateClick(day)}
                  disabled={past}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative ${
                    past
                      ? 'text-gray-300 cursor-not-allowed'
                      : selected
                      ? 'bg-cyan-600 text-white font-bold shadow-md'
                      : today
                      ? 'bg-orange-500 text-white font-bold'
                      : hasApt
                      ? 'bg-teal-100 text-teal-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  {day}
                  {hasApt && !selected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-teal-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <div className="w-3 h-3 bg-cyan-600 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 bg-teal-100 rounded"></div>
              <span>Has Appointment</span>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Activities</h3>
            {activities.length > 0 && (
              <Link href="/dashboard/student/notifications" className="text-sm text-gray-600 hover:text-gray-900">See all</Link>
            )}
          </div>

          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-teal-600">{activity.title}</span>
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(activity.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No activities yet</p>
              <p className="text-sm text-gray-400">Your recent activities will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Booking Modal */}
      {showAppointmentModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <CalendarIcon className="text-cyan-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Book Appointment</h3>
                <p className="text-sm text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Clock size={16} className="inline mr-2" />
                Select Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedTime('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={!selectedTime}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}