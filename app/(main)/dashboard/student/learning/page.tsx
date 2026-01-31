"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Play, CheckCircle2, TrendingUp, FileText } from 'lucide-react';

export default function StudentLearningPage() {
  const router = useRouter();
  const supabase = getSupabaseClient(); // ✅ Use shared client instead of creating new one

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      // ✅ Use getSession() instead of getUser() - more reliable
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        router.push('/login');
        return;
      }

      const user = session.user;

      // Get enrollments with course data
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*)
        `)
        .eq('student_id', user.id);

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        setLoading(false);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      // Get lesson counts and progress for each course
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          const course = enrollment.courses;
          
          // Get total lessons
          const { data: lessons, count: totalLessons } = await supabase
            .from('lessons')
            .select('id', { count: 'exact' })
            .eq('course_id', course.id);

          // Get completed lessons
          const { count: completedLessons } = await supabase
            .from('lesson_progress')
            .select('id', { count: 'exact' })
            .eq('student_id', user.id)
            .eq('course_id', course.id)
            .eq('completed', true);

          // Get total quizzes
          const { count: totalQuizzes } = await supabase
            .from('quizzes')
            .select('id', { count: 'exact' })
            .eq('course_id', course.id);

          const progress = totalLessons ? Math.round(((completedLessons || 0) / totalLessons) * 100) : 0;

          return {
            ...course,
            totalLessons: totalLessons || 0,
            completedLessons: completedLessons || 0,
            totalQuizzes: totalQuizzes || 0,
            progress,
            enrolledAt: enrollment.enrolled_at,
          };
        })
      );

      setEnrolledCourses(coursesWithProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Learning</h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Start learning by enrolling in a course</p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer group"
              onClick={() => router.push(`/courses/${course.id}/watch`)}
            >
              {/* Thumbnail */}
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/50" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                  {course.totalQuizzes > 0 && (
                    <span className="flex items-center text-purple-600">
                      <FileText className="w-4 h-4 mr-1" />
                      {course.totalQuizzes} {course.totalQuizzes === 1 ? 'quiz' : 'quizzes'}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                {course.progress === 100 && (
                  <div className="mb-4">
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/courses/${course.id}/watch`);
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {course.progress === 0 ? 'Start Learning' : course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {enrolledCourses.length > 0 && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-800">{enrolledCourses.length}</p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-800">
                  {enrolledCourses.filter(c => c.progress === 100).length}
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-800">
                  {enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}