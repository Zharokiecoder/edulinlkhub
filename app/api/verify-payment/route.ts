import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { reference, courseId, userId } = await req.json();

    console.log('=== PAYMENT VERIFICATION STARTED ===');
    console.log('Reference:', reference);
    console.log('Course ID:', courseId);
    console.log('User ID:', userId);

    // Verify payment with Paystack
    console.log('Verifying with Paystack...');
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();
    console.log('Paystack response status:', paystackData.status);
    console.log('Paystack data:', JSON.stringify(paystackData, null, 2));

    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.error('Paystack verification failed:', paystackData);
      return NextResponse.json(
        { error: 'Payment verification failed with Paystack', details: paystackData },
        { status: 400 }
      );
    }

    console.log('Payment verified with Paystack ✅');

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get course details
    console.log('Fetching course details...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Course error:', courseError);
      return NextResponse.json(
        { error: 'Course not found', details: courseError },
        { status: 404 }
      );
    }

    console.log('Course found:', course.title);

    // Check if already enrolled
    console.log('Checking existing enrollment...');
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      console.log('Already enrolled ✅');
      return NextResponse.json({
        success: true,
        message: 'Already enrolled',
        enrollment: existingEnrollment,
      });
    }

    // Create enrollment
    console.log('Creating enrollment...');
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        instructor_id: course.instructor_id,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress: 0,
        status: 'active',
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to create enrollment', details: enrollmentError },
        { status: 500 }
      );
    }

    console.log('Enrollment created ✅');

    // Record payment
    console.log('Recording payment...');
    const amount = paystackData.data.amount / 100; // Convert from kobo to naira
    
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: userId,
        instructor_id: course.instructor_id,
        course_id: courseId,
        amount: amount,
        currency: paystackData.data.currency,
        stripe_payment_intent_id: reference,
        status: 'succeeded',
        payment_method: 'paystack',
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      // Don't fail if payment recording fails - enrollment is what matters
    } else {
      console.log('Payment recorded ✅');
    }

    // Calculate instructor earnings (85% to instructor, 15% platform fee)
    console.log('Recording instructor earnings...');
    const platformFee = amount * 0.15;
    const netAmount = amount * 0.85;

    const { error: earningsError } = await supabase
      .from('instructor_earnings')
      .insert({
        instructor_id: course.instructor_id,
        amount: amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'pending',
      });

    if (earningsError) {
      console.error('Earnings record error:', earningsError);
      // Don't fail if earnings recording fails
    } else {
      console.log('Earnings recorded ✅');
    }

    console.log('=== VERIFICATION COMPLETE ✅ ===');

    return NextResponse.json({
      success: true,
      message: 'Payment verified and enrollment created',
      enrollment,
      amount,
      reference,
    });
  } catch (error: any) {
    console.error('=== VERIFICATION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Payment verification failed', details: error.message },
      { status: 500 }
    );
  }
}