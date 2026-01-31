'use client'

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Award, Download, Share2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  instructor_id: string;
  instructor?: {
    full_name: string;
  };
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

interface QuizAttempt {
  quiz_id: string;
  score: number;
  passed: boolean;
  created_at: string;
}

export default function StudentCertificationPage() {
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkCompletedCourses();
  }, []);

  const checkCompletedCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ User authentication error:', userError);
        setError('Please log in to view certificates');
        setLoading(false);
        return;
      }

      console.log('👤 Current user:', user.id, user.email);

      // Get all enrollments for this student
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses (
            id,
            title,
            instructor_id,
            users!courses_instructor_id_fkey (
              full_name
            )
          )
        `)
        .eq('user_id', user.id);

      if (enrollError) {
        console.error('❌ Error fetching enrollments:', enrollError);
        setError('Failed to load enrollments');
        setLoading(false);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        console.log('📚 No enrollments found');
        setLoading(false);
        return;
      }

      console.log(`✅ Total enrollments: ${enrollments.length}`);

      const eligible: any[] = [];

      // Check each enrolled course
      for (const enrollment of enrollments) {
        const course = enrollment.courses;
        if (!course) continue;

        console.log(`\n📚 Checking course: ${course.title}`);

        // Get all lessons for this course
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id);

        if (lessonsError) {
          console.error(`  ❌ Error fetching lessons:`, lessonsError);
          continue;
        }

        const totalLessons = lessons?.length || 0;
        console.log(`  📖 Total lessons: ${totalLessons}`);

        // Get all quizzes for this course
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', course.id);

        if (quizzesError) {
          console.error(`  ❌ Error fetching quizzes:`, quizzesError);
          continue;
        }

        const totalQuizzes = quizzes?.length || 0;
        console.log(`  📝 Total quizzes: ${totalQuizzes}`);

        // Get completed lessons
        const { data: completedLessons, error: progressError } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('lesson_id', lessons?.map((l: any) => l.id) || []);

        if (progressError) {
          console.error(`  ❌ Error fetching lesson progress:`, progressError);
        }

        const completedLessonsCount = completedLessons?.length || 0;
        console.log(`  ✅ Completed lessons: ${completedLessonsCount}/${totalLessons}`);

        // Get passed quiz attempts
        let passedQuizzesCount = 0;
        
        if (totalQuizzes > 0 && quizzes) {
          const quizIds = quizzes.map((q: any) => q.id);
          
          // Get ALL quiz attempts for these quizzes
          const { data: allAttempts, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .in('quiz_id', quizIds);

          if (attemptsError) {
            console.error(`  ❌ Error fetching quiz attempts:`, attemptsError);
          } else {
            console.log(`  📊 Total quiz attempts:`, allAttempts?.length || 0);
            
            if (allAttempts && allAttempts.length > 0) {
              console.log('  📝 Quiz attempts details:');
              allAttempts.forEach((attempt: any) => {
                console.log(`    - Quiz ID: ${attempt.quiz_id}, Score: ${attempt.score}, Passed: ${attempt.passed}`);
              });

              // Get unique quizzes that were passed
              const passedQuizIds = new Set(
                allAttempts
                  .filter((attempt: any) => attempt.passed === true)
                  .map((attempt: any) => attempt.quiz_id)
              );
              
              passedQuizzesCount = passedQuizIds.size;
              console.log(`  ✅ Unique passed quizzes: ${passedQuizzesCount}/${totalQuizzes}`);
            } else {
              console.log('  ⚠️ No quiz attempts found');
            }
          }
        }

        const totalItems = totalLessons + totalQuizzes;
        const completedItems = completedLessonsCount + passedQuizzesCount;
        const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        console.log(`  📊 Progress: ${completedItems}/${totalItems} = ${progressPercentage.toFixed(1)}%`);

        // Course is complete if ALL lessons are done AND ALL quizzes are passed
        const allLessonsCompleted = totalLessons === 0 || completedLessonsCount === totalLessons;
        const allQuizzesPassed = totalQuizzes === 0 || passedQuizzesCount === totalQuizzes;
        const isComplete = allLessonsCompleted && allQuizzesPassed && totalItems > 0;

        console.log(`  📋 All lessons completed: ${allLessonsCompleted}`);
        console.log(`  📋 All quizzes passed: ${allQuizzesPassed}`);
        console.log(`  ${isComplete ? '🎉 COURSE COMPLETE! Ready for certificate!' : '⏳ Course not complete yet'}`);

        if (isComplete) {
          eligible.push({
            courseId: course.id,
            courseTitle: course.title,
            instructorName: course.users?.full_name || 'Instructor',
            completedItems,
            totalItems,
            progress: 100
          });
        }
      }

      console.log(`\n🎓 Total eligible courses: ${eligible.length}`);
      setCompletedCourses(eligible);
      setLoading(false);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleClaimCertificate = (courseId: string, courseTitle: string) => {
    router.push(`/certificate?courseId=${courseId}&courseTitle=${encodeURIComponent(courseTitle)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking your course completions...</p>
          <p className="text-sm text-gray-400 mt-2">Check browser console (F12) for detailed logs</p>
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
        {/* Header */}
        <div className="text-center mb-12">
          <Award className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Certificates
          </h1>
          <p className="text-xl text-gray-600">
            Claim certificates for courses you've completed
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Debugging Tips:</strong> Open browser console (F12) to see detailed completion checks.
            Certificates appear here only when you complete ALL lessons AND pass ALL quizzes in a course.
          </p>
        </div>

        {/* Certificates Grid */}
        {completedCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Certificates Yet
              </h3>
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
                <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <Award className="w-12 h-12 mb-3" />
                  <h3 className="text-xl font-bold">{course.courseTitle}</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Instructor: {course.instructorName}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Course Progress</span>
                      <span className="text-sm font-semibold text-green-600">
                        {course.progress}% Complete
                      </span>
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
                    onClick={() => handleClaimCertificate(course.courseId, course.courseTitle)}
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