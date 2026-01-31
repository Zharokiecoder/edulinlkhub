"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const supabase = getSupabaseClient(); // ✅ Use shared client

  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      // ✅ Use getSession() - allows viewing courses without login
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      // Get course
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('Course error:', error);
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // Check enrollment if user is logged in
      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .single();

        setIsEnrolled(!!enrollment);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    // Check if user is logged in for enrollment
    if (!currentUser) {
      // Store current URL to return after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('returnUrl', window.location.pathname);
      }
      alert('Please login to enroll in this course');
      router.push('/login');
      return;
    }

    setProcessing(true);

    // Free course enrollment
    if (!course.price || course.price === 0) {
      try {
        const { error } = await supabase
          .from('enrollments')
          .insert({
            student_id: currentUser.id,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            progress: 0,
          });

        if (error) throw error;
        alert('Enrolled successfully! ✅ Redirecting to your courses...');
        setIsEnrolled(true);
        
        // Redirect to learning page after a moment
        setTimeout(() => {
          router.push('/dashboard/student/learning');
        }, 1000);
        
        setProcessing(false);
      } catch (error: any) {
        console.error('Enrollment error:', error);
        alert('Failed to enroll: ' + error.message);
        setProcessing(false);
      }
      return;
    }

    // Paid course - use Paystack
    handlePayment();
  };

  const handlePayment = () => {
    console.log('Starting payment...');
    console.log('User:', currentUser);
    console.log('Course price:', course.price);

    // Check if Paystack is loaded
    if (typeof window !== 'undefined' && window.PaystackPop) {
      initPaystack();
      return;
    }

    // Load Paystack
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => initPaystack();
    script.onerror = () => {
      setProcessing(false);
      alert('Failed to load payment. Please try again.');
    };
  };

  const initPaystack = () => {
    try {
      console.log('Initializing Paystack...');
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.email) {
        setProcessing(false);
        // Store current URL to return after login
        if (typeof window !== 'undefined') {
          localStorage.setItem('returnUrl', window.location.pathname);
        }
        alert('Please login to make a payment');
        router.push('/login');
        return;
      }
      
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: currentUser.email,
        amount: Math.round(course.price * 100),
        currency: 'NGN',
        ref: `${Date.now()}_${courseId}_${currentUser.id}`,
        metadata: {
          course_id: courseId,
          user_id: currentUser.id,
          course_title: course.title,
        },
        onClose: () => {
          setProcessing(false);
          console.log('Payment closed');
        },
        callback: (response: any) => {
          console.log('Payment success:', response);
          verifyPayment(response.reference);
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error('Paystack error:', error);
      setProcessing(false);
      alert('Payment failed: ' + error);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          courseId: courseId,
          userId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/payment-success?reference=${reference}&courseId=${courseId}`);
      } else {
        alert('Payment verification failed. Reference: ' + reference);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Error verifying payment. Reference: ' + reference);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Course Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Thumbnail */}
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-6xl">📚</span>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{course.title}</h1>
            <p className="text-gray-600 mb-6">{course.description || 'No description available.'}</p>

            {/* Price */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Course Price:</p>
              <p className="text-4xl font-bold text-blue-600">
                {course.price === 0 || !course.price ? '🎉 FREE' : `₦${course.price.toLocaleString()}`}
              </p>
            </div>

            {/* Action Button */}
            <div className="space-y-4">
              {isEnrolled ? (
                <div>
                  <button
                    onClick={() => router.push('/dashboard/student/learning')}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Continue Learning
                  </button>
                  <p className="text-center text-sm text-green-600 mt-2">✅ You're enrolled in this course</p>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {course.price === 0 || !course.price ? '🎉 Enroll for Free' : '💳 Buy Now'}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Course Details */}
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">What You'll Learn</h2>
              <div className="space-y-2 text-gray-600">
                <p>✓ Master the fundamentals</p>
                <p>✓ Build real-world projects</p>
                <p>✓ Industry best practices</p>
                <p>✓ Certificate upon completion</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">This Course Includes</h2>
              <div className="space-y-2 text-gray-600">
                <p>✓ Lifetime access</p>
                <p>✓ Mobile and desktop access</p>
                <p>✓ Certificate of completion</p>
                <p>✓ 24/7 support</p>
              </div>
            </div>

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
                <p className="font-bold mb-2">🔍 Debug Info:</p>
                <p>Logged in: {currentUser ? '✅ Yes' : '❌ No'}</p>
                {currentUser && <p>Email: {currentUser.email}</p>}
                {currentUser && <p>User ID: {currentUser.id}</p>}
                <p>Course Price: ₦{course.price || 0}</p>
                <p>Enrolled: {isEnrolled ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}