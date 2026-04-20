import { useEffect, useState } from 'react';
import type { Routine, Logs, Category, TimeFilter } from '../types';
import { format } from 'date-fns';

const ROUTINES_KEY = 'godlife_routines';
const LOGS_KEY = 'godlife_logs';

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem(ROUTINES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [logs, setLogs] = useState<Logs>(() => {
    const saved = localStorage.getItem(LOGS_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  const addRoutine = (name: string, category: Category, timeOfDay: TimeFilter, icon: string) => {
    const newRoutine: Routine = {
      id: crypto.randomUUID(),
      name,
      category,
      timeOfDay,
      icon,
      createdAt: new Date().toISOString(),
    };
    setRoutines(prev => [...prev, newRoutine]);
  };

  const deleteRoutine = (id: string) => {
    if (!window.confirm('정말 이 루틴을 삭제할까요?')) return;
    
    setRoutines(prev => prev.filter(r => r.id !== id));
    
    // Optional: remove logs for this routine (or keep for historical stats)
    // For now we'll remove it from logs to match prompt requirement: "전체 logs에서도 해당 ID 제거"
    setLogs(prev => {
      const nextLogs = { ...prev };
      for (const date in nextLogs) {
        if (nextLogs[date][id] !== undefined) {
          delete nextLogs[date][id];
        }
      }
      return nextLogs;
    });
  };

  const toggleRoutineLog = (dateStr: string, routineId: string) => {
    setLogs(prev => {
      const dayLog = prev[dateStr] || {};
      return {
        ...prev,
        [dateStr]: {
          ...dayLog,
          [routineId]: !dayLog[routineId]
        }
      };
    });
  };

  // calculate progress for a specific date
  const getProgress = (dateStr: string) => {
    if (routines.length === 0) return 0;
    
    const dayLog = logs[dateStr] || {};
    const checkedCount = routines.filter(r => dayLog[r.id]).length;
    return Math.round((checkedCount / routines.length) * 100);
  };
  
  // Calculate consecutive days strike (100% completion)
  const getStrikeDays = (todayStr: string) => {
    let strike = 0;
    let current = new Date(todayStr);
    
    while (true) {
      const dateStr = format(current, 'yyyy-MM-dd');
      if (getProgress(dateStr) === 100) {
        strike++;
        current.setDate(current.getDate() - 1); // go back one day
      } else {
        break;
      }
    }
    return strike;
  };

  return {
    routines,
    logs,
    addRoutine,
    deleteRoutine,
    toggleRoutineLog,
    getProgress,
    getStrikeDays
  };
}
