export type Category = 'Exercise' | 'Study' | 'Mindset' | 'Health';
export type TimeFilter = '전체' | '아침' | '낮' | '저녁';

export interface Routine {
  id: string;
  name: string;
  category: Category;
  timeOfDay: TimeFilter;
  icon: string;
  createdAt: string;
}

export interface DailyLog {
  [routineId: string]: boolean;
}

export interface Logs {
  [dateString: string]: DailyLog;
}
