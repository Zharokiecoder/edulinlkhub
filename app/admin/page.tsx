'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, GraduationCap, BookOpen, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  activeEnrollments: number;
  studentGrowth: number;
  instructorGrowth: number;
  courseGrowth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    studentGrowth: 0,
    instructorGrowth: 0,
    courseGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Fetch instructors count
      const { count: instructorsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'educator');

      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Fetch enrollments count
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate growth (simplified - comparing to last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: lastMonthStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .lt('created_at', lastMonth.toISOString());

      const { count: lastMonthInstructors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'educator')
        .lt('created_at', lastMonth.toISOString());

      const { count: lastMonthCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString());

      setStats({
        totalStudents: studentsCount || 0,
        totalInstructors: instructorsCount || 0,
        totalCourses: coursesCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        studentGrowth: calculateGrowth(lastMonthStudents || 0, studentsCount || 0),
        instructorGrowth: calculateGrowth(lastMonthInstructors || 0, instructorsCount || 0),
        courseGrowth: calculateGrowth(lastMonthCourses || 0, coursesCount || 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      growth: stats.studentGrowth,
      icon: Users,
      color: 'blue',
      href: '/admin/students',
    },
    {
      title: 'Total Instructors',
      value: stats.totalInstructors,
      growth: stats.instructorGrowth,
      icon: GraduationCap,
      color: 'purple',
      href: '/admin/instructors',
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      growth: stats.courseGrowth,
      icon: BookOpen,
      color: 'green',
      href: '/admin/courses',
    },
    {
      title: 'Active Enrollments',
      value: stats.activeEnrollments,
      growth: 0,
      icon: TrendingUp,
      color: 'orange',
      href: '/admin/courses',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.growth !== 0 && (
                  <div className={`flex items-center text-sm font-medium ${
                    stat.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.growth > 0 ? (
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(stat.growth)}%
                  </div>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/students">
            <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-left">
              Manage Students
            </button>
          </Link>
          <Link href="/admin/instructors">
            <button className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-left">
              Manage Instructors
            </button>
          </Link>
          <Link href="/admin/courses">
            <button className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-left">
              Manage Courses
            </button>
          </Link>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Student to Instructor Ratio</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalInstructors > 0 
                  ? (stats.totalStudents / stats.totalInstructors).toFixed(1) 
                  : 0}:1
              </p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Average Enrollments per Course</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCourses > 0 
                  ? (stats.activeEnrollments / stats.totalCourses).toFixed(1) 
                  : 0}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}