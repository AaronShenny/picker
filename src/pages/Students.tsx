import { useState, useEffect } from 'react';
import { fetchStudents, toggleStudentPresence } from '../services/studentService';
import type { Student } from '../types';
import FlickerSpinner from '../components/FlickerSpinner';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setStudents(students.map(s => s.id === id ? { ...s, present: !currentStatus } : s));
    try {
      await toggleStudentPresence(id, currentStatus);
    } catch (e) {
      console.error(e);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><FlickerSpinner size={36} /></div>;
  }

  const presentCount = students.filter(s => s.present).length;

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-1">Roster</p>
          <h1 className="font-display text-3xl text-white tracking-tight">Students</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white">{presentCount}<span className="text-[#444] text-base font-normal">/{students.length}</span></p>
          <p className="text-xs text-[#444]">present today</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        {students.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-[#333] text-sm">No students. Upload a CSV in Settings.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#161616]">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-3">
              <span className="col-span-2 text-xs text-[#444] uppercase tracking-wider">Roll</span>
              <span className="col-span-8 text-xs text-[#444] uppercase tracking-wider">Name</span>
              <span className="col-span-2 text-xs text-[#444] uppercase tracking-wider text-right">Status</span>
            </div>

            {students.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-[#141414] transition-colors"
              >
                <span className="col-span-2 text-xs font-mono text-[#555]">{student.roll_no}</span>
                <span className="col-span-8 text-sm font-medium text-white">{student.name}</span>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => handleToggle(student.id, student.present)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-200 ${
                      student.present ? 'badge-present' : 'badge-absent'
                    }`}
                  >
                    {student.present ? 'Present' : 'Absent'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
