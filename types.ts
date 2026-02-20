
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
  startTime: string; 
  endTime: string;   
  icon: string;      
  isActive: boolean;
  repeat: RepeatOption;
  alarmEnabled: boolean;
  alarmLeadMinutes?: number; 
  notes: string;
  color: string;     
  createdAt: string; 
  subtasks?: Subtask[];
}

export type NoteBlockType = 'text' | 'checklist' | 'table' | 'doodle';

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  data: any; 
}

export interface Note {
  id: string;
  title: string;
  content: string; 
  blocks?: NoteBlock[];
  updatedAt: string;
  createdAt: string;
}

export type FinanceCategory = 'Rent' | 'Subscription' | 'Utility' | 'Insurance' | 'Loan' | 'Person' | 'Grocery' | 'Other';
export type FinanceType = 'debt' | 'credit' | 'fixed';

export interface FinanceEntry {
  id: string;
  title: string;
  person?: string; // For debt/credit
  amount: number;
  type: FinanceType;
  category: FinanceCategory;
  date: string;
  dueDate?: string;
  isSettled: boolean;
  note?: string;
}

export type AppMode = 'routines' | 'notes' | 'finance';
export type ViewState = 'timeline' | 'edit' | 'settings' | 'note-editor' | 'tests' | 'finance-editor';
