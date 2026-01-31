import { supabase } from './supabase';

export async function createUserProfile(userId: string, userData: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          role: userData.role || 'student',
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          country: userData.country || null,
          subject: userData.subject || null,
          qualification: userData.qualification || null,
          experience: userData.experience || null,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { data: null, error };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
}