import { supabase } from './supabase';

export async function createActivity(userId: string, title: string, description: string, type: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          user_id: userId,
          title,
          description,
          type
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating activity:', error);
    return { success: false, error };
  }
}