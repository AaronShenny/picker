import { supabase } from './supabase';
import { getAppState, saveAppState } from './stateService';
import { fetchActiveStudents } from './studentService';
import type { Student, AppState } from '../types';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const revealNextStudent = async (): Promise<Student | null> => {
  let state = await getAppState();
  let students = await fetchActiveStudents();

  if (students.length === 0) {
    return null; // No present students
  }

  // Need a new queue?
  if (!state.queue || state.queue.length === 0 || state.current_index >= state.queue.length) {
    // Generate new queue
    const studentIds = students.map(s => s.id);
    const newQueue = shuffleArray(studentIds);
    
    // Only increment cycle if it's not the very first run (where queue is completely empty initially)
    const newCycle = state.queue && state.queue.length > 0 ? state.current_cycle + 1 : state.current_cycle;

    state = {
      ...state,
      queue: newQueue,
      current_index: 0,
      current_cycle: newCycle
    };
    await saveAppState({ queue: newQueue, current_index: 0, current_cycle: newCycle });
  }

  // Loop to find next valid student (skipping ones that were marked absent mid-cycle)
  while (state.current_index < state.queue.length) {
    const nextStudentId = state.queue[state.current_index];
    const student = students.find(s => s.id === nextStudentId);

    if (student) {
      // Valid student found!
      
      // 1. Insert into history
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          student_id: student.id,
          cycle_number: state.current_cycle,
          roll_no: student.roll_no,
          student_name: student.name
        });
      
      if (historyError) throw historyError;

      // 2. Update state index
      await saveAppState({ current_index: state.current_index + 1 });

      return student;
    } else {
      // Student is no longer active or was deleted, skip them
      state.current_index++;
    }
  }

  // If we exhausted the rest of the queue because they were all absent, 
  // recursively call once to start a new cycle
  await saveAppState({ current_index: state.queue.length });
  return revealNextStudent();
};
