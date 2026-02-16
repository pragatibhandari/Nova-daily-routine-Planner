
export enum RepeatOption {
  NONE = 'None',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export type DurationOption = '15m' | '30m' | '45m' | '1h' | '2h';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  icon: string;      // Material Symbol name
  isActive: boolean;
  repeat: RepeatOption;
  alarmEnabled: boolean;
  alarmLeadMinutes?: number; // 0 or 5
  notes: string;
  color: string;     // Hex color or Tailwind class
  createdAt: string; // ISO date string YYYY-MM-DD
  subtasks?: Subtask[];
}

export type ViewState = 'timeline' | 'edit' | 'settings';
