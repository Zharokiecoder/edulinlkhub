'use client'

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Award, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function StudentCertificationPage() {
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    checkCompletedCourses();
  }, []);

  const checkCompletedCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Please log in to view certificates');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const name = profile?.name || user.email?.split('@')[0] || 'Student';
      setStudentName(name);

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses (
            id,
            title,
            instructor_id
          )
        `)
        .eq('student_id', user.id);

      if (enrollError) {
        setError('Failed to load enrollments');
        setLoading(false);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const eligible: any[] = [];

      for (const enrollment of enrollments) {
        const course = enrollment.courses;
        if (!course) continue;

        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id);

        if (lessonsError) continue;
        const totalLessons = lessons?.length || 0;

        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', course.id);

        if (quizzesError) continue;
        const totalQuizzes = quizzes?.length || 0;

        const { data: completedLessons } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('student_id', user.id)
          .eq('completed', true)
          .in('lesson_id', lessons?.map((l: any) => l.id) || []);

        const completedLessonsCount = completedLessons?.length || 0;

        let passedQuizzesCount = 0;

        if (totalQuizzes > 0 && quizzes) {
          const quizIds = quizzes.map((q: any) => q.id);

          const { data: allAttempts, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('student_id', user.id)
            .in('quiz_id', quizIds);

          if (!attemptsError && allAttempts && allAttempts.length > 0) {
            const passedQuizIds = new Set(
              allAttempts
                .filter((attempt: any) => attempt.passed === true)
                .map((attempt: any) => attempt.quiz_id)
            );
            passedQuizzesCount = passedQuizIds.size;
          }
        }

        const totalItems = totalLessons + totalQuizzes;
        const completedItems = completedLessonsCount + passedQuizzesCount;

        const allLessonsCompleted = totalLessons === 0 || completedLessonsCount === totalLessons;
        const allQuizzesPassed = totalQuizzes === 0 || passedQuizzesCount === totalQuizzes;
        const isComplete = allLessonsCompleted && allQuizzesPassed && totalItems > 0;

        if (isComplete) {
          const { data: instructorProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', course.instructor_id)
            .single();

          eligible.push({
            courseId: course.id,
            courseTitle: course.title,
            instructorName: instructorProfile?.name || 'Instructor',
            completedItems,
            totalItems,
            progress: 100
          });
        }
      }

      setCompletedCourses(eligible);
      setLoading(false);

    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  // Fetches the name fresh from DB right when the button is clicked
  // This guarantees we never use a stale or empty studentName state
  const handleClaimCertificate = async (courseId: string, courseTitle: string, instructorName: string) => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let name = studentName; // use state as default

    // Re-fetch to be sure
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      name = profile?.name || user.email?.split('@')[0] || 'Student';
    }

    const certNumber = `CERT-${new Date().getFullYear()}-${courseId.substring(0, 8).toUpperCase()}`;
    const currentDate = new Date().toLocaleDateString();

    const url = `/certificate?student=${encodeURIComponent(name)}&course=${encodeURIComponent(courseTitle)}&instructor=${encodeURIComponent(instructorName)}&date=${encodeURIComponent(currentDate)}&number=${encodeURIComponent(certNumber)}`;

    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking your course completions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Award className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Certificates</h1>
          <p className="text-xl text-gray-600">Claim certificates for courses you've completed</p>
          {studentName && (
            <p className="text-sm text-gray-500 mt-2">
              Welcome, <strong>{studentName}</strong>
            </p>
          )}
        </div>

        {completedCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
              <p className="text-gray-600 mb-4">
                Complete all lessons and pass all quizzes in a course to earn a certificate.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>✅ Complete all lessons</p>
                <p>✅ Pass all quizzes (score 70% or higher)</p>
                <p>✅ Certificate will appear here</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedCourses.map((course) => (
              <div
                key={course.courseId}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <Award className="w-12 h-12 mb-3" />
                  <h3 className="text-xl font-bold">{course.courseTitle}</h3>
                  <p className="text-blue-100 text-sm mt-1">Instructor: {course.instructorName}</p>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Course Progress</span>
                      <span className="text-sm font-semibold text-green-600">{course.progress}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.completedItems}/{course.totalItems} items completed
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      All lessons completed
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      All quizzes passed
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimCertificate(course.courseId, course.courseTitle, course.instructorName)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Claim Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}