import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    const signature = request.headers.get('x-paystack-signature');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle the event
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100; // Convert from kobo

      // Get course and student info from metadata
      const { courseId, studentId } = data.metadata || {};

      if (!courseId || !studentId) {
        console.error('Missing metadata in payment');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Fetch course
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .single();

      if (existingEnrollment) {
        return NextResponse.json({ message: 'Already enrolled' });
      }

      // Create payment record
      await supabase.from('payments').insert({
        student_id: studentId,
        instructor_id: course.instructor_id,
        course_id: courseId,
        amount: amount,
        currency: data.currency,
        stripe_payment_intent_id: reference,
        status: 'succeeded',
        payment_method: data.channel,
      });

      // Enroll student
      await supabase.from('enrollments').insert({
        student_id: studentId,
        course_id: courseId,
        progress: 0,
        status: 'active',
      });

      // Calculate earnings
      const platformFee = amount * 0.15;
      const netAmount = amount * 0.85;

      await supabase.from('instructor_earnings').insert({
        instructor_id: course.instructor_id,
        payment_id: reference,
        amount: amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'pending',
      });

      // Create activity
      await supabase.from('activities').insert({
        user_id: studentId,
        type: 'enrollment',
        title: 'Course Purchased',
        description: `Successfully enrolled in ${course.title}`,
      });

      console.log(`Payment successful: ${reference}`);
    }

    return NextResponse.json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}