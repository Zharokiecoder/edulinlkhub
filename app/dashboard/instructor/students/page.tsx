'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Mail, MessageCircle, BarChart3, TrendingUp, Users, Award, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function InstructorStudentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, filterCourse, students]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch instructor's courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user.id);

      setCourses(coursesData || []);

      // Fetch enrollments with student details
      const { data: enrollmentsData, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:profiles!enrollments_student_id_fkey(*),
          course:courses(id, title, subject)
        `)
        .eq('instructor_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      setStudents(enrollmentsData || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCourse !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.course_id === filterCourse);
    }

    setFilteredStudents(filtered);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-green-600';
    if (progress >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const stats = {
    totalStudents: new Set(students.map(s => s.student_id)).size,
    activeStudents: students.filter(s => s.progress > 0).length,
    completedCourses: students.filter(s => s.progress === 100).length,
    avgProgress: students.length > 0 
      ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length) 
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14B8A6] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <TrendingUp size={20} className="text-white/60" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalStudents}</p>
          <p className="text-white/80 text-sm">Total Students</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.activeStudents}</p>
          <p className="text-white/80 text-sm">Active Learners</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
              <Award size={24} />
            </div>
            <TrendingUp size={20} className="text-white/60" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.completedCourses}</p>
          <p className="text-white/80 text-sm">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.avgProgress}%</p>
          <p className="text-white/80 text-sm">Avg Progress</p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
          <p className="text-gray-600">Manage and track your students' progress</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name or email..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent outline-none font-medium"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="space-y-4">
          {filteredStudents.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all"
            >
              <div className="flex items-start gap-6">
                {/* Student Avatar */}
                <img
                  src={enrollment.student?.avatar_url || `https://ui-avatars.com/api/?name=${enrollment.student?.name || 'Student'}&background=14B8A6&color=fff&size=200`}
                  alt={enrollment.student?.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                />

                {/* Student Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {enrollment.student?.name || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {enrollment.student?.email}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-[#14B8A6]/10 text-[#14B8A6] rounded-lg text-xs font-semibold">
                          {enrollment.course?.subject}
                        </span>
                        <span className="text-sm text-gray-600">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2.5 bg-[#14B8A6]/10 text-[#14B8A6] rounded-xl hover:bg-[#14B8A6]/20 transition-colors">
                        <Mail size={18} />
                      </button>
                      <button className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Course: {enrollment.course?.title}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">Progress</span>
                          <span className="text-sm font-bold text-gray-900">{enrollment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${getProgressColor(enrollment.progress)} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                      </div>
                      {enrollment.progress === 100 && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg">
                          <Award size={14} />
                          <span className="text-xs font-semibold">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Last active: 2 days ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} />
                      <span>5/12 lessons completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={48} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {searchQuery || filterCourse !== 'all' ? 'No students found' : 'No students yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterCourse !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Students will appear here when they enroll in your courses'}
          </p>
        </div>
      )}
    </div>
  );
}