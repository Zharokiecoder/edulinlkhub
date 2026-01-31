'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Star, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  const subjects = [
    'All Subjects',
    'Computer Science',
    'Mathematics',
    'English',
    'Science',
    'Business',
    'Art & Design',
    'Music',
    'Language',
    'Engineering',
    'Marketing',
    'Other'
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedSubject, selectedLevel, priceFilter, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(course => course.subject === selectedSubject);
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    // Price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(course => course.price === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(course => course.price > 0);
    }

    setFilteredCourses(filtered);
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0D9488] to-[#0a7a6f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing Courses
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Learn from expert instructors and advance your skills
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for courses..."
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={20} />
                Filters
              </h3>

              {/* Subject Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
                >
                  <option value="all">All Subjects</option>
                  {subjects.slice(1).map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="all"
                      checked={priceFilter === 'all'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-4 h-4 text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <span className="ml-2 text-sm text-gray-700">All Courses</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="free"
                      checked={priceFilter === 'free'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-4 h-4 text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Free</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="paid"
                      checked={priceFilter === 'paid'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-4 h-4 text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Paid</span>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedSubject !== 'all' || selectedLevel !== 'all' || priceFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('all');
                    setSelectedLevel('all');
                    setPriceFilter('all');
                  }}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredCourses.length}</span> courses
              </p>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {/* Course Thumbnail */}
                    <div className="relative h-48 bg-gray-200">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-5xl">📚</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900">
                          {course.level}
                        </span>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-[#0D9488] bg-[#0D9488]/10 px-2 py-1 rounded">
                          {course.subject}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0D9488] transition-colors">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Instructor */}
                      <div className="flex items-center gap-2 mb-4">
                        <img
                          src={course.instructor?.avatar_url || `https://ui-avatars.com/api/?name=${course.instructor?.name}&background=0D9488&color=fff`}
                          alt={course.instructor?.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-700">
                          {course.instructor?.name}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span>{course.average_rating?.toFixed(1) || '5.0'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users size={14} />
                            <span>{course.total_students || 0}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-[#0D9488]">
                          {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('all');
                    setSelectedLevel('all');
                    setPriceFilter('all');
                  }}
                  className="px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}