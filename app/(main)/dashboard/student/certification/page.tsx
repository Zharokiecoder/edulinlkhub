'use client'

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Award, Download, Share2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  instructor_id: string;
  instructor?: {
    name: string;
  };
}

interface Certificate {
  id: string;
  course_id: string;
  certificate_number: string;
  issued_date: string;
  grade: number;
  course?: Course;
}

interface CompletedCourse extends Course {
  totalItems: number;
  completedItems: number;
  progress: number;
  averageGrade: number;
}

export default function StudentCertificationPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('Student');
  const supabase = getSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      console.log('🔍 Loading certification data...');
      
      // Get current session instead of getUser() - more reliable
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid session:', sessionError);
        router.push('/login');
        return;
      }

      const user = session.user;
      console.log('✅ Valid session for user:', user.id);

      // Get student profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (profile?.name) {
        setStudentName(profile.name);
        console.log('✅ Student name:', profile.name);
      }

      // Load existing certificates
      const { data: certs } = await supabase
        .from('certificates')
        .select(`
          *,
          course:courses(
            id,
            title,
            instructor:profiles!courses_instructor_id_fkey(name)
          )
        `)
        .eq('student_id', user.id)
        .order('issued_date', { ascending: false });

      if (certs) {
        setCertificates(certs);
        console.log('✅ Existing certificates:', certs.length);
      }

      // Load enrolled courses to find completed ones
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course:courses(
            id,
            title,
            instructor:profiles!courses_instructor_id_fkey(name)
          )
        `)
        .eq('student_id', user.id);

      if (!enrollments) {
        console.log('❌ No enrollments found');
        setLoading(false);
        return;
      }

      console.log('✅ Total enrollments:', enrollments.length);

      const completed: CompletedCourse[] = [];

      for (const enrollment of enrollments) {
        const course = enrollment.course as Course;
        if (!course) continue;

        console.log(`\n📚 Checking course: ${course.title}`);

        // Check if certificate already exists
        const hasCertificate = certs?.some((cert: Certificate) => cert.course_id === course.id);
        if (hasCertificate) {
          console.log(`✅ Already has certificate for: ${course.title}`);
          continue;
        }

        // Get all lessons for this course
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id);

        // Get all quizzes for this course
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', course.id);

        const totalLessons = lessons?.length || 0;
        const totalQuizzes = quizzes?.length || 0;
        const totalItems = totalLessons + totalQuizzes;

        console.log(`  📊 Total items: ${totalItems} (${totalLessons} lessons + ${totalQuizzes} quizzes)`);

        if (totalItems === 0) {
          console.log('  ⚠️ No content in this course');
          continue;
        }

        // Get completed lessons
        let completedLessonsCount = 0;
        if (lessons && lessons.length > 0) {
          const { data: completedLessons } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('student_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessons.map((l: any) => l.id));

          completedLessonsCount = completedLessons?.length || 0;
          console.log(`  ✅ Completed lessons: ${completedLessonsCount}/${totalLessons}`);
        }

        // Get passed quizzes - FIXED QUERY
        let passedQuizzes: any[] = [];
        let completedQuizzesCount = 0;
        if (quizzes && quizzes.length > 0) {
          const quizIds = quizzes.map((q: any) => q.id);
          
          // Get ALL quiz attempts for these quizzes
          const { data: allAttempts, error: quizError } = await supabase
            .from('quiz_attempts')
            .select('quiz_id, score, passed')
            .eq('student_id', user.id)
            .in('quiz_id', quizIds);

          if (quizError) {
            console.error(`  ❌ Error fetching quiz attempts:`, quizError);
          } else {
            console.log(`  📝 All quiz attempts:`, allAttempts);
            
            // Filter for passed attempts
            passedQuizzes = (allAttempts || []).filter((attempt: any) => attempt.passed === true);
            
            // Get unique passed quizzes
            const uniquePassedQuizIds = new Set(passedQuizzes.map((q: any) => q.quiz_id));
            completedQuizzesCount = uniquePassedQuizIds.size;
            
            console.log(`  ✅ Passed quizzes: ${completedQuizzesCount}/${totalQuizzes}`);
            console.log(`  📊 Passed quiz IDs:`, Array.from(uniquePassedQuizIds));
          }
        }

        const completedItems = completedLessonsCount + completedQuizzesCount;
        const progress = Math.round((completedItems / totalItems) * 100);

        console.log(`  📊 Progress: ${completedItems}/${totalItems} = ${progress}%`);

        // Calculate average grade from passed quiz attempts
        let averageGrade = 100;
        if (passedQuizzes && passedQuizzes.length > 0) {
          const totalScore = passedQuizzes.reduce((sum, q) => sum + q.score, 0);
          averageGrade = Math.round(totalScore / passedQuizzes.length);
          console.log(`  📊 Average grade: ${averageGrade}%`);
        }

        // Course is 100% complete when ALL items are done
        if (progress === 100) {
          console.log(`  🎉 COURSE COMPLETE! Ready for certificate!`);
          completed.push({
            ...course,
            totalItems,
            completedItems,
            progress,
            averageGrade
          });
        } else {
          console.log(`  ⏳ Not yet complete (${progress}%)`);
        }
      }

      console.log(`\n✅ Total courses ready for certificate: ${completed.length}`);
      setCompletedCourses(completed);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateCertificate(course: CompletedCourse) {
    try {
      setGenerating(course.id);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Generate unique certificate number
      const certNumber = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      console.log('🎓 Generating certificate:', certNumber);

      // Create certificate
      const { error } = await supabase
        .from('certificates')
        .insert({
          student_id: session.user.id,
          course_id: course.id,
          certificate_number: certNumber,
          issued_date: new Date().toISOString(),
          completion_date: new Date().toISOString(),
          grade: course.averageGrade
        });

      if (error) {
        console.error('❌ Error creating certificate:', error);
        alert('Failed to generate certificate. Please try again.');
        return;
      }

      console.log('✅ Certificate created successfully!');

      // Open certificate in new tab
      const certUrl = `/certificate?student=${encodeURIComponent(studentName)}&course=${encodeURIComponent(course.title)}&grade=${course.averageGrade}%&instructor=${encodeURIComponent(course.instructor?.name || 'Instructor')}&date=${encodeURIComponent(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}&number=${certNumber}`;
      
      window.open(certUrl, '_blank');

      // Reload data
      await loadData();
    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(null);
    }
  }

  function viewCertificate(cert: Certificate) {
    const course = cert.course as Course;
    const certUrl = `/certificate?student=${encodeURIComponent(studentName)}&course=${encodeURIComponent(course.title)}&grade=${cert.grade}%&instructor=${encodeURIComponent(course.instructor?.name || 'Instructor')}&date=${encodeURIComponent(new Date(cert.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}&number=${cert.certificate_number}`;
    
    window.open(certUrl, '_blank');
  }

  function shareCertificate(cert: Certificate) {
    const course = cert.course as Course;
    const certUrl = `${window.location.origin}/certificate?student=${encodeURIComponent(studentName)}&course=${encodeURIComponent(course.title)}&grade=${cert.grade}%&instructor=${encodeURIComponent(course.instructor?.name || 'Instructor')}&date=${encodeURIComponent(new Date(cert.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}&number=${cert.certificate_number}`;
    
    navigator.clipboard.writeText(certUrl);
    alert('Certificate link copied to clipboard! 📋');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
          <p className="text-gray-600">View and download your course completion certificates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready to Claim</p>
                <p className="text-2xl font-bold text-gray-900">{completedCourses.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {certificates.length > 0
                    ? Math.round(certificates.reduce((sum, c) => sum + c.grade, 0) / certificates.length)
                    : 0}%
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Completed Courses - Ready to Claim */}
        {completedCourses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎉 Ready to Claim Certificate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedCourses.map(course => (
                <div key={course.id} className="bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-600">
                        Instructor: {course.instructor?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        ✅ Course Completed - Grade: {course.averageGrade}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Completed: {course.completedItems}/{course.totalItems} items
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  </div>
                  
                  <button
                    onClick={() => generateCertificate(course)}
                    disabled={generating === course.id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
                  >
                    {generating === course.id ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </span>
                    ) : (
                      '🎓 Generate Certificate'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Certificates */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Certificates</h2>
          {certificates.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
              <p className="text-gray-600">Complete courses to earn certificates!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map(cert => {
                const course = cert.course as Course;
                return (
                  <div key={cert.id} className="bg-white border border-gray-200 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-600">
                          Instructor: {course.instructor?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Issued: {new Date(cert.issued_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-purple-600 font-semibold">
                          Grade: {cert.grade}%
                        </p>
                      </div>
                      <Award className="w-6 h-6 text-purple-600 shrink-0" />
                    </div>

                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="text-xs text-gray-600">Certificate Number</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{cert.certificate_number}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewCertificate(cert)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        View & Download
                      </button>
                      <button
                        onClick={() => shareCertificate(cert)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}