import Papa from 'papaparse';
import type { Student } from '../types';

export const parseCSV = (file: File): Promise<Omit<Student, 'id' | 'created_at'>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Validate columns
        if (data.length > 0 && !('rollno' in data[0] || 'roll_no' in data[0])) {
          return reject(new Error('CSV must contain a "rollno" or "roll_no" column.'));
        }
        if (data.length > 0 && !('name' in data[0])) {
          return reject(new Error('CSV must contain a "name" column.'));
        }

        const students: Omit<Student, 'id' | 'created_at'>[] = [];
        const rollNos = new Set<string>();

        for (const row of data) {
          const roll_no = String(row.rollno || row.roll_no).trim();
          const name = String(row.name).trim();

          if (!roll_no || !name) continue;

          if (rollNos.has(roll_no)) {
            return reject(new Error(`Duplicate roll number found: ${roll_no}. Please fix the file and try again.`));
          }

          rollNos.add(roll_no);
          students.push({
            roll_no,
            name,
            present: true,
          });
        }

        resolve(students);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
