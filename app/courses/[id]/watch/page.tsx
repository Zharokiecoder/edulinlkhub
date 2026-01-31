"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, FileText, CheckCircle, Circle, Target } from 'lucide-react';

export default function CourseViewerPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const supabase = getSupabaseClient(); // ✅ Use shared client

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      // ✅ Use getSession() instead of getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No session in watch page:', sessionError);
        router.push('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
      }

      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      setLessons(lessonsData || []);
      if (lessonsData && lessonsData.length > 0) {
        setCurrentLesson(lessonsData[0]);
      }

      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      console.log('QUIZZES LOADED:', quizzesData);
      setQuizzes(quizzesData || []);

      // Fetch progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', currentUser.id)
        .eq('course_id', courseId);

      setProgress(progressData || []);

      // Fetch quiz attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', currentUser.id)
        .eq('course_id', courseId)
        .eq('passed', true);

      setQuizAttempts(attemptsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
    }
  };

  const markComplete = async () => {
    if (!currentLesson || !user) return;

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: user.id,
        lesson_id: currentLesson.id,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    if (!error) {
      fetchData();
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } else {
      console.error('Error marking complete:', error);
    }
  };

  const isCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const calculateProgress = () => {
    const totalItems = lessons.length + quizzes.length;
    if (totalItems === 0) return 0;
    
    const completedLessons = progress.filter(p => p.completed).length;
    const passedQuizzes = quizAttempts.length; // Only count passed quiz attempts
    
    const completedItems = completedLessons + passedQuizzes;
    return Math.round((completedItems / totalItems) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
          <button
            onClick={() => router.push('/dashboard/student/learning')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <button
              onClick={() => router.push('/dashboard/student/learning')}
              className="flex items-center text-gray-300 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Learning
            </button>
            <h1 className="text-2xl font-bold">{course?.title}</h1>
            <p className="text-sm text-gray-400">Progress: {calculateProgress()}%</p>
          </div>

          {/* Video/PDF Player */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {currentLesson ? (
              currentLesson.content_type === 'pdf' ? (
                <iframe
                  src={currentLesson.pdf_url}
                  className="w-full h-full"
                  title={currentLesson.title}
                />
              ) : (
                <iframe
                  src={(() => {
                    const url = currentLesson.video_url;
                    // YouTube
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      const videoId = url.includes('youtu.be') 
                        ? url.split('youtu.be/')[1]?.split('?')[0]
                        : url.split('v=')[1]?.split('&')[0];
                      return `https://www.youtube.com/embed/${videoId}`;
                    }
                    // Vimeo
                    if (url.includes('vimeo.com')) {
                      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
                      return `https://player.vimeo.com/video/${videoId}`;
                    }
                    // Direct video URL
                    return url;
                  })()}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={currentLesson.title}
                />
              )
            ) : (
              <div className="text-center">
                <p className="text-gray-400">No lesson selected</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="font-semibold">{currentLesson?.title}</h3>
                <p className="text-sm text-gray-400">{currentLesson?.description}</p>
              </div>
              {currentLesson && !isCompleted(currentLesson.id) && (
                <button
                  onClick={markComplete}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                >
                  Mark Complete
                </button>
              )}
              {currentLesson && isCompleted(currentLesson.id) && (
                <span className="flex items-center text-green-400 flex-shrink-0">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">
              Course Content
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {lessons.length} lessons • {quizzes.length} quizzes
            </p>

            {/* Lessons */}
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    currentLesson?.id === lesson.id
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {isCompleted(lesson.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">Lesson {index + 1}</h4>
                        <div className="flex items-center text-xs text-gray-300">
                          {lesson.content_type === 'pdf' ? (
                            <FileText className="w-4 h-4 mr-1" />
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          {lesson.duration} min
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{lesson.title}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quizzes */}
              {quizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  onClick={() => router.push(`/quizzes/${quiz.id}/take`)}
                  className="p-3 rounded-lg cursor-pointer bg-purple-600 hover:bg-purple-700 transition"
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {quizAttempts.some(a => a.quiz_id === quiz.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Target className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">Quiz {index + 1}</h4>
                        {quiz.is_required && (
                          <span className="text-xs bg-red-500 px-2 py-1 rounded">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-1">{quiz.title}</p>
                      <p className="text-xs text-purple-200">
                        {quiz.passing_score}% to pass
                        {quiz.time_limit && ` • ${quiz.time_limit} min`}
                        {quiz.attempts_allowed && ` • ${quiz.attempts_allowed} attempts`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}