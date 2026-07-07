import { useState, useEffect } from 'react';
import { fetchHistory } from '../services/historyService';
import { revealNextStudent } from '../services/pickerService';
import { getAppState } from '../services/stateService';
import type { Student, HistoryRecord } from '../types';
import FlickerSpinner from '../components/FlickerSpinner';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [cycle, setCycle] = useState(1);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [revealedStudent, setRevealedStudent] = useState<Student | null>(null);

  const loadData = async () => {
    try {
      const [histData, stateData] = await Promise.all([fetchHistory(), getAppState()]);
      setHistory(histData.slice(0, 6));
      setCycle(stateData.current_cycle);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleReveal = async () => {
    setRevealing(true);
    setRevealedStudent(null);

    setTimeout(async () => {
      try {
        const student = await revealNextStudent();
        setRevealedStudent(student);
        await loadData();
      } catch (e) {
        console.error(e);
      } finally {
        setRevealing(false);
      }
    }, 1800);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FlickerSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      {/* Page header */}
      <div>
        <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-1">Cycle {cycle}</p>
        <h1 className="font-display text-3xl text-white tracking-tight">Who's next?</h1>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* === Main reveal card === */}
        <div className="col-span-3 panel flex flex-col min-h-[440px] overflow-hidden">
          {/* Student display area */}
          <div className="flex-1 flex items-center justify-center p-10">
            <AnimatePresence mode="wait">
              {revealing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5"
                >
                  <FlickerSpinner size={48} />
                  <p className="text-[#444] text-xs tracking-[0.25em] uppercase">Selecting…</p>
                </motion.div>
              ) : revealedStudent ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="text-center w-full px-4"
                >
                  <p className="text-[#444] text-xs font-mono tracking-widest mb-3">
                    #{revealedStudent.roll_no}
                  </p>
                  <h2
                    className="font-display text-white leading-tight break-words"
                    style={{
                      fontSize: revealedStudent.name.length > 20
                        ? revealedStudent.name.length > 30 ? '2.25rem' : '3rem'
                        : '4rem',
                    }}
                  >
                    {revealedStudent.name}
                  </h2>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="dot-pulse flex items-center justify-center gap-1.5 mb-4">
                    <span /><span /><span />
                  </div>
                  <p className="text-[#333] text-sm">Ready when you are</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reveal button */}
          <div className="p-6 border-t border-[#181818]">
            <button
              onClick={handleReveal}
              disabled={revealing}
              className="w-full py-3.5 rounded-xl bg-white text-black text-sm font-semibold transition-all duration-200 hover:bg-[#e8e8e8] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {revealing ? 'Picking…' : 'Reveal Student'}
            </button>
          </div>
        </div>

        {/* === Recent picks === */}
        <div className="col-span-2 panel flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#181818]">
            <h3 className="text-sm font-medium text-[#888]">Recent Picks</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <p className="text-[#333] text-sm text-center">No picks yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#161616]">
                {history.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#141414] transition-colors min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{record.student_name}</p>
                      <p className="text-xs text-[#444] mt-0.5">
                        {new Date(record.selected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#333] shrink-0">#{record.roll_no}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
