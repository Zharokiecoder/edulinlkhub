'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function StudentMyCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    filterEnrollments();
  }, [searchQuery, filterStatus, enrollments]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles!courses_instructor_id_fkey(name, avatar_url)
          )
        `)
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      setEnrollments(data || []);
      setFilteredEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = () => {
    let filtered = [...enrollments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.course?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course?.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus === 'in-progress') {
      filtered = filtered.filter(e => e.progress > 0 && e.progress < 100);
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(e => e.progress === 100);
    } else if (filterStatus === 'not-started') {
      filtered = filtered.filter(e => e.progress === 0);
    }

    setFilteredEnrollments(filtered);
  };

  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter(e => e.progress > 0 && e.progress < 100).length,
    completed: enrollments.filter(e => e.progress === 100).length,
    notStarted: enrollments.filter(e => e.progress === 0).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Track your learning progress</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <BookOpen size={24} className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Courses</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} className="text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Award size={24} className="text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock size={24} className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.notStarted}</p>
            <p className="text-sm text-gray-600">Not Started</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
              >
                <option value="all">All Courses</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="not-started">Not Started</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses List */}
        {filteredEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course?.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="md:w-80 h-48 md:h-auto relative bg-gray-200">
                    {enrollment.course?.thumbnail_url ? (
                      <Image
                        src={enrollment.course.thumbnail_url}
                        alt={enrollment.course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-5xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-[#0D9488]/10 text-[#0D9488] rounded-full text-xs font-semibold">
                            {enrollment.course?.subject}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold capitalize">
                            {enrollment.course?.level}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#0D9488] transition-colors">
                          {enrollment.course?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {enrollment.course?.description}
                        </p>

                        {/* Instructor */}
                        <div className="flex items-center gap-2 mb-4">
                          <img
                            src={enrollment.course?.instructor?.avatar_url || `https://ui-avatars.com/api/?name=${enrollment.course?.instructor?.name}&background=0D9488&color=fff`}
                            alt={enrollment.course?.instructor?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-gray-700">
                            {enrollment.course?.instructor?.name}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-bold text-[#0D9488]">
                              {enrollment.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#0D9488] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${enrollment.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {enrollment.progress === 0 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                              Not Started
                            </span>
                          )}
                          {enrollment.progress > 0 && enrollment.progress < 100 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">
                              In Progress
                            </span>
                          )}
                          {enrollment.progress === 100 && (
                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Award size={14} />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Continue Button */}
                      <button className="ml-4 px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold whitespace-nowrap">
                        {enrollment.progress === 0 ? 'Start Course' : 'Continue Learning'}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No courses found' : 'No enrolled courses yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start learning by enrolling in a course'}
            </p>
            {!(searchQuery || filterStatus !== 'all') && (
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold"
              >
                Browse Courses
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}