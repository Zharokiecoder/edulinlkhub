"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Play, CheckCircle2, TrendingUp, FileText, Award, Star, X } from 'lucide-react';

export default function StudentLearningPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCongratulatoryModal, setShowCongratulatoryModal] = useState(false);
  const [completedCourse, setCompletedCourse] = useState<any>(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  useEffect(() => {
    const checkForCompletion = () => {
      const recentlyCompleted = enrolledCourses.find(course => {
        const wasJustCompleted = localStorage.getItem(`course_${course.id}_just_completed`);
        return course.progress === 100 && wasJustCompleted === 'true';
      });

      if (recentlyCompleted) {
        setCompletedCourse(recentlyCompleted);
        setShowCongratulatoryModal(true);
        localStorage.removeItem(`course_${recentlyCompleted.id}_just_completed`);
      }
    };

    if (enrolledCourses.length > 0) {
      checkForCompletion();
    }
  }, [enrolledCourses]);

  const fetchEnrolledCourses = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        router.push('/login');
        return;
      }

      const user = session.user;

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

      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          const course = enrollment.courses;
          
          // Get total lessons
          const { count: totalLessons } = await supabase
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

          // Get unique passed quizzes (count each quiz only once)
          const { data: quizAttempts } = await supabase
            .from('quiz_attempts')
            .select('quiz_id')
            .eq('student_id', user.id)
            .eq('course_id', course.id)
            .eq('passed', true);

          const uniquePassedQuizzes = new Set(quizAttempts?.map((attempt: { quiz_id: any; }) => attempt.quiz_id) || []);
          const completedQuizzes = uniquePassedQuizzes.size;

          // Calculate progress
          const totalItems = (totalLessons || 0) + (totalQuizzes || 0);
          const completedItems = (completedLessons || 0) + completedQuizzes;
          const progress = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;

          return {
            ...course,
            totalLessons: totalLessons || 0,
            completedLessons: completedLessons || 0,
            totalQuizzes: totalQuizzes || 0,
            completedQuizzes: completedQuizzes,
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

  const closeCongratulatoryModal = () => {
    setShowCongratulatoryModal(false);
    setCompletedCourse(null);
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
      {/* Congratulatory Modal */}
      {showCongratulatoryModal && completedCourse && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-bounce-in">
            <button
              onClick={closeCongratulatoryModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full mb-4 animate-pulse">
                <Award className="w-12 h-12 text-white" />
              </div>
              <div className="flex justify-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                🎉 Congratulations! 🎉
              </h2>
              <p className="text-gray-600 text-lg mb-4">
                You've successfully completed
              </p>
              <p className="text-xl font-semibold text-blue-600 mb-4">
                {completedCourse.title}
              </p>
              <p className="text-gray-600">
                You've finished all {completedCourse.totalLessons} lessons and {completedCourse.totalQuizzes} {completedCourse.totalQuizzes === 1 ? 'quiz' : 'quizzes'}!
              </p>
            </div>

            <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{completedCourse.totalLessons}</p>
                  <p className="text-sm text-gray-600">Lessons Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{completedCourse.totalQuizzes}</p>
                  <p className="text-sm text-gray-600">Quizzes Passed</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  closeCongratulatoryModal();
                  router.push(`/dashboard/student/certification`);
                }}
                className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
              >
                Get Your Certificate
              </button>
              <button
                onClick={() => {
                  closeCongratulatoryModal();
                  router.push('/courses');
                }}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                Explore More Courses
              </button>
            </div>
          </div>
        </div>
      )}

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
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-48 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/50" />
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                  {course.totalQuizzes > 0 && (
                    <span className="flex items-center text-purple-600">
                      <FileText className="w-4 h-4 mr-1" />
                      {course.completedQuizzes}/{course.totalQuizzes} {course.totalQuizzes === 1 ? 'quiz' : 'quizzes'}
                    </span>
                  )}
                </div>

                {course.progress === 100 && (
                  <div className="mb-4">
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  </div>
                )}

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

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}