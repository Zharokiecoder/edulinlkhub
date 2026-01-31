"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, XCircle, Clock, ArrowRight, Home } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const courseId = searchParams.get('courseId');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [enrollment, setEnrollment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    checkEnrollment();
  }, []);

  const checkEnrollment = async () => {
    try {
      // Wait 2 seconds for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !courseId) {
        setStatus('error');
        return;
      }

      // Check if enrolled
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentData) {
        // Get course details
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        setEnrollment(enrollmentData);
        setCourse(courseData);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Enrollment check error:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing Payment</h1>
          <p className="text-gray-600 mb-4">Please wait while we confirm your enrollment...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Processing</h1>
          <p className="text-gray-600 mb-6">
            Your payment is being processed. If you made a successful payment, your course will appear in your dashboard shortly.
          </p>
          
          {reference && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-500 mb-1">Payment Reference:</p>
              <p className="text-xs font-mono text-gray-700 break-all">{reference}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/student/learning')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/courses')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Browse Courses
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            💡 Note: Payment processing may take a few moments. Check your dashboard in 1-2 minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Success Animation */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-once">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-green-200 rounded-full animate-ping"></div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h1>
        <p className="text-gray-600 mb-6">You're now enrolled in the course</p>

        {/* Course Info */}
        {course && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">{course.title}</h2>
            <p className="text-sm text-gray-600">Start learning right away!</p>
          </div>
        )}

        {/* Confirmation Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-3">Confirmation Details:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-semibold">✓ Enrolled</span>
            </div>
            {reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="text-gray-800 font-mono text-xs">{reference.substring(0, 20)}...</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Access:</span>
              <span className="text-gray-800 font-semibold">Lifetime</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Access your course anytime from the Learning dashboard</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Track your progress as you complete lessons</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Earn a certificate upon completion</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard/student/learning')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center shadow-lg"
          >
            Start Learning Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <button
            onClick={() => router.push('/dashboard/student')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          A confirmation email has been sent to your inbox
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
          <p className="text-gray-600 mb-4">Please wait...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}