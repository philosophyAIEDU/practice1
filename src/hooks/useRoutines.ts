import { useEffect, useState } from 'react';
import type { Routine, Logs, Category, TimeFilter } from '../types';
import { format } from 'date-fns';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, getDocs } from 'firebase/firestore';

export function useRoutines() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<Logs>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRoutines([]);
      setLogs({});
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to routines
    const routinesRef = collection(db, 'users', user.uid, 'routines');
    const qRoutines = query(routinesRef);
    const unsubscribeRoutines = onSnapshot(qRoutines, (snapshot) => {
      const fetchedRoutines: Routine[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Routine));
      setRoutines(fetchedRoutines);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('데이터를 불러오는데 실패했습니다.');
      setLoading(false);
    });

    // Listen to logs
    const logsRef = collection(db, 'users', user.uid, 'logs');
    const qLogs = query(logsRef);
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const fetchedLogs: Logs = {};
      snapshot.docs.forEach(doc => {
        fetchedLogs[doc.id] = doc.data() as Record<string, boolean>;
      });
      setLogs(fetchedLogs);
    }, (err) => {
      console.error(err);
    });

    return () => {
      unsubscribeRoutines();
      unsubscribeLogs();
    };
  }, [user]);

  const addRoutine = async (name: string, category: Category, timeOfDay: TimeFilter, icon: string) => {
    if (!user) return;
    setError(null);
    try {
      const newId = crypto.randomUUID();
      const newRoutine = {
        name,
        category,
        timeOfDay,
        icon,
        createdAt: new Date().toISOString(),
      };
      
      // Save to Firestore
      const routineDoc = doc(db, 'users', user.uid, 'routines', newId);
      await setDoc(routineDoc, newRoutine);
    } catch (err) {
      console.error(err);
      setError('루틴 추가에 실패했습니다.');
      alert('루틴 추가에 실패했습니다.');
    }
  };

  const deleteRoutine = async (id: string) => {
    if (!user) return;
    if (!window.confirm('정말 이 루틴을 삭제할까요?')) return;
    
    setError(null);
    try {
      const routineDoc = doc(db, 'users', user.uid, 'routines', id);
      await deleteDoc(routineDoc);
    } catch (err) {
      console.error(err);
      setError('루틴 삭제에 실패했습니다.');
      alert('루틴 삭제에 실패했습니다.');
    }
  };

  const toggleRoutineLog = async (dateStr: string, routineId: string) => {
    if (!user) return;
    
    setError(null);
    try {
      const logDoc = doc(db, 'users', user.uid, 'logs', dateStr);
      const dayLog = logs[dateStr] || {};
      const currentState = dayLog[routineId] || false;
      
      // We update or set the doc
      await setDoc(logDoc, {
        ...dayLog,
        [routineId]: !currentState
      });
    } catch (err) {
      console.error(err);
      setError('체크 업데이트에 실패했습니다.');
      alert('체크 업데이트에 실패했습니다.');
    }
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
    loading,
    error,
    addRoutine,
    deleteRoutine,
    toggleRoutineLog,
    getProgress,
    getStrikeDays
  };
}
