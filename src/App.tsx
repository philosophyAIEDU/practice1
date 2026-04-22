import { useState, useMemo, useEffect, useRef } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { PlusCircle, Trash2, Calendar as CalendarIcon, User, BarChart2, Repeat, Check, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRoutines } from './hooks/useRoutines';
import { useAuth } from './contexts/AuthContext';
import { cn } from './lib/utils';
import type { Category, TimeFilter } from './types';

const CATEGORIES: Category[] = ['Exercise', 'Study', 'Mindset', 'Health'];
const TIMES: TimeFilter[] = ['전체', '아침', '낮', '저녁'];
const EMOJIS = ['🏃', '📚', '🧘', '🍎', '💧', '🌿', '🏋️', '💻'];

export default function App() {
  const { user, loginWithGoogle, logout, loading } = useAuth();
  const { routines, logs, addRoutine, deleteRoutine, toggleRoutineLog, getProgress, getStrikeDays } = useRoutines();
  
  const [today] = useState(() => new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayProgress = getProgress(todayStr);
  
  // Previous progress state to detect 100% completion event
  const prevProgressRef = useRef(todayProgress);
  useEffect(() => {
    if (prevProgressRef.current < 100 && todayProgress === 100 && routines.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      alert('🎉 오늘 갓생 완료!');
    }
    prevProgressRef.current = todayProgress;
  }, [todayProgress, routines.length]);

  const strikeDays = getStrikeDays(todayStr);

  // Form State
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<Category>('Exercise');
  const [newTime, setNewTime] = useState<TimeFilter>('아침');
  const [newIcon, setNewIcon] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) {
      alert('루틴 이름을 입력해주세요.');
      return;
    }
    const finalIcon = newIcon || '✅';
    addRoutine(newName.trim(), newCat, newTime, finalIcon);
    setNewName('');
    setNewCat('Exercise');
    setNewTime('아침');
    setNewIcon('');
  };

  // List State
  const [listFilter, setListFilter] = useState<TimeFilter>('전체');
  
  const filteredRoutines = useMemo(() => {
    if (listFilter === '전체') return routines;
    return routines.filter(r => r.timeOfDay === listFilter || r.timeOfDay === '전체');
  }, [routines, listFilter]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStatusColor = (dateString: string) => {
    const p = getProgress(dateString);
    if (p === 100) return 'bg-primary dark:bg-teal-400';
    if (p > 0) return 'bg-secondary';
    // If it's a past date and 0%, make it error
    if (new Date(dateString) < new Date(todayStr)) return 'bg-error text-white';
    return 'bg-surface-container-highest';
  };

  const getDayDotColor = (dateString: string) => {
    const dayLog = logs[dateString];
    if (!dayLog || Object.keys(dayLog).length === 0) return 'opacity-0'; // none
    
    const p = getProgress(dateString);
    if (p === 100) return 'bg-primary'; // Greenish/Primary
    if (p > 0) return 'bg-secondary'; // Amberish/Secondary
    return 'bg-error'; // Red
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-primary font-bold">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <h1 className="font-headline font-bold text-primary text-4xl mb-2">✨ 나의 갓생 루틴</h1>
        <p className="text-on-surface-variant mb-10 text-center">당신만의 멋진 하루를 계획하고 기록하세요.<br/>어디서든 실시간으로 동기화됩니다.</p>
        <button 
          onClick={loginWithGoogle}
          className="bg-surface-container-lowest text-on-surface border border-outline-variant/30 px-6 py-4 rounded-full shadow-lg flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span className="font-bold text-lg">Google 계정으로 시작하기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="text-on-surface bg-background min-h-[100dvh] relative pb-32">
      <header className="flex flex-col pt-6 pb-4 px-6 w-full max-w-2xl mx-auto z-40 bg-surface sticky top-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-headline tracking-tight font-bold text-primary text-2xl">✨ 나의 갓생 루틴</h1>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="p-2 text-on-surface-variant hover:text-error transition-colors" title="로그아웃">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold border border-outline-variant/30 overflow-hidden shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
              ) : (
                user.displayName?.charAt(0) || "U"
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-5 bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm font-semibold text-on-surface-variant mb-1">{format(today, 'yyyy년 M월 d일 (E)', { locale: ko })}</p>
              <p className="text-xl font-headline font-extrabold text-primary">오늘의 달성률 {todayProgress}%</p>
            </div>
            {strikeDays > 0 && (
              <div className="text-secondary font-bold text-lg animate-pulse">🔥 {strikeDays}일째</div>
            )}
          </div>
          <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full relative transition-all duration-500 ease-out" 
              style={{ width: `${todayProgress}%` }}
            >
              {todayProgress > 0 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full mr-1 shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-10">
        <section>
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 shadow-sm">
            <h3 className="text-lg font-bold font-headline mb-4 flex items-center gap-2">
              <PlusCircle className="text-primary w-6 h-6" /> 새 루틴 만들기
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block px-1">루틴 이름</label>
                <input 
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary text-on-surface placeholder:text-outline-variant transition-all outline-none" 
                  placeholder="어떤 습관을 만들까요?" 
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block px-1">카테고리</label>
                  <select 
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 text-on-surface outline-none"
                    value={newCat}
                    onChange={e => setNewCat(e.target.value as Category)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block px-1">시간대</label>
                  <select 
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 text-on-surface outline-none"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value as TimeFilter)}
                  >
                    {TIMES.filter(t => t !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                 <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block px-1">아이콘 선택</label>
                 <div className="grid grid-cols-8 gap-2">
                   {EMOJIS.map(emoji => (
                     <button
                       key={emoji}
                       onClick={() => setNewIcon(emoji)}
                       className={cn(
                         "aspect-square flex items-center justify-center rounded-lg text-xl hover:scale-110 transition-transform",
                         newIcon === emoji ? "bg-primary-container ring-2 ring-primary" : "bg-surface-container-highest"
                       )}
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold rounded-full text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                루틴 추가
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold font-headline">나의 체크리스트</h3>
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-full">
              {TIMES.map(t => (
                <button 
                  key={t}
                  onClick={() => setListFilter(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                    listFilter === t 
                      ? "bg-surface-container-highest text-primary shadow-sm" 
                      : "text-on-surface-variant hover:bg-surface-container-highest/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {routines.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <p>등록된 루틴이 없습니다.</p>
                <p className="text-sm">위에서 새 루틴을 만들어보세요!</p>
              </div>
            ) : filteredRoutines.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <p>해당 시간에 등록된 루틴이 없습니다.</p>
              </div>
            ) : (
              filteredRoutines.map(routine => {
                const isChecked = !!(logs[todayStr] && logs[todayStr][routine.id]);
                
                let catColor = "bg-primary-container text-on-primary-container";
                if (routine.category === 'Study') catColor = "bg-secondary-container text-secondary";
                if (routine.category === 'Health') catColor = "bg-error-container text-error";
                if (routine.category === 'Mindset') catColor = "bg-tertiary-container text-tertiary";

                return (
                  <div key={routine.id} className={cn(
                    "group flex items-center p-5 bg-surface-container-lowest rounded-lg shadow-sm transition-all border-l-4",
                    isChecked ? "border-primary opacity-60" : "border-transparent hover:translate-x-1"
                  )}>
                    <div className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-full text-2xl mr-4",
                      isChecked ? "bg-surface-container-highest" : "bg-surface-container-highest"
                    )}>
                      {routine.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-lg font-bold", isChecked && "line-through text-on-surface-variant")}>
                          {routine.name}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", catColor)}>
                          {routine.category}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{routine.timeOfDay} 목표</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => deleteRoutine(routine.id)}
                        className="p-2 text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <button 
                        onClick={() => toggleRoutineLog(todayStr, routine.id)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          isChecked 
                            ? "bg-primary text-on-primary shadow-sm" 
                            : "border-2 border-outline-variant hover:border-primary text-transparent"
                        )}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="pb-10">
          <div className="bg-surface-container-low p-6 rounded-lg shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-headline">{format(currentMonth, 'yyyy년 M월')}</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1 hover:bg-surface-container-highest rounded-full text-on-surface-variant hover:text-primary transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1 hover:bg-surface-container-highest rounded-full text-on-surface-variant hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <span key={day} className="text-[10px] font-bold text-on-surface-variant uppercase">{day}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, today);
                const p = getProgress(dayStr);
                const isFuture = day > today;

                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium relative transition-colors",
                      !isCurrentMonth ? "opacity-20 bg-transparent" : "bg-surface-container-lowest shadow-sm",
                      isSelected && "ring-2 ring-primary bg-surface-container-highest"
                    )}
                  >
                    <span className={cn(
                      isSelected && "text-primary font-bold"
                    )}>{format(day, 'd')}</span>
                    
                    {/* Activity Dot */}
                    {!isFuture && routines.length > 0 && isCurrentMonth && (
                      <span className={cn("w-1.5 h-1.5 rounded-full mt-1", getDayDotColor(dayStr))}></span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-around items-center pt-4 border-t border-outline-variant/20">
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> 100%
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> 1%~99%
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span> 0%
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-surface-container-highest/80 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-8px_32px_rgba(0,0,0,0.2)] border-t border-outline-variant/20">
        <button className="flex flex-col items-center justify-center text-primary px-6 py-2 scale-105 transition-transform">
          <Repeat className="w-6 h-6" />
          <span className="font-label text-[10px] font-bold uppercase tracking-wider mt-1">Routine</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:text-primary transition-colors">
          <CalendarIcon className="w-6 h-6" />
          <span className="font-label text-[10px] font-bold uppercase tracking-wider mt-1">Calendar</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:text-primary transition-colors">
          <BarChart2 className="w-6 h-6" />
          <span className="font-label text-[10px] font-bold uppercase tracking-wider mt-1">Stats</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:text-primary transition-colors">
          <User className="w-6 h-6" />
          <span className="font-label text-[10px] font-bold uppercase tracking-wider mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
}
