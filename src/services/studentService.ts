import { supabase } from './supabase';
import type { Student } from '../types';

export const fetchStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('roll_no', { ascending: true });

  if (error) throw error;
  return data as Student[];
};

export const fetchActiveStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('present', true)
    .order('roll_no', { ascending: true });

  if (error) throw error;
  return data as Student[];
};

export const replaceStudents = async (students: Omit<Student, 'id' | 'created_at'>[]) => {
  // First, clear existing students (history cascade deletes, app_state might need reset)
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) throw deleteError;

  if (students.length > 0) {
    const { error: insertError } = await supabase
      .from('students')
      .insert(students);

    if (insertError) throw insertError;
  }
};

export const toggleStudentPresence = async (id: string, currentStatus: boolean) => {
  const { error } = await supabase
    .from('students')
    .update({ present: !currentStatus })
    .eq('id', id);

  if (error) throw error;
};
