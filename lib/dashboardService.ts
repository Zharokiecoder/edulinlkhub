import { supabase } from './supabase';

// Get instructor dashboard stats
export async function getInstructorStats(instructorId: string) {
  try {
    // Get profile with stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', instructorId)
      .single();

    if (profileError) throw profileError;

    // Get total courses
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructorId)
      .eq('status', 'active');

    // Get today's classes
    const today = new Date().toISOString().split('T')[0];
    const { data: todayClasses, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    if (classesError) throw classesError;

    // Get recent enrollments
    const { data: recentEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(name, avatar_url),
        course:courses(title)
      `)
      .eq('instructor_id', instructorId)
      .order('enrolled_at', { ascending: false })
      .limit(5);

    if (enrollmentsError) throw enrollmentsError;

    // Get top courses
    const { data: topCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('status', 'active')
      .order('total_students', { ascending: false })
      .limit(3);

    if (coursesError) throw coursesError;

    return {
      profile,
      totalStudents: profile?.total_students || 0,
      activeCourses: coursesCount || 0,
      totalEarnings: profile?.total_earnings || 0,
      averageRating: profile?.average_rating || 0,
      todayClasses: todayClasses || [],
      recentEnrollments: recentEnrollments || [],
      topCourses: topCourses || [],
    };
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    return null;
  }
}

// Get student dashboard stats
export async function getStudentStats(studentId: string) {
  try {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError) throw profileError;

    // Get enrolled courses
    const { data: enrolledCourses, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(
          *,
          instructor:profiles!courses_instructor_id_fkey(name, avatar_url)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (enrollmentsError) throw enrollmentsError;

    // Get upcoming classes
    const now = new Date().toISOString();
    const { data: upcomingClasses, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        course:courses(title)
      `)
      .gte('scheduled_at', now)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (classesError) throw classesError;

    return {
      profile,
      enrolledCourses: enrolledCourses || [],
      upcomingClasses: upcomingClasses || [],
      totalCourses: profile?.enrolled_courses || 0,
      completedCourses: profile?.completed_courses || 0,
      learningHours: profile?.learning_hours || 0,
    };
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return null;
  }
}