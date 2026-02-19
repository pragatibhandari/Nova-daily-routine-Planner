
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
  alarmLeadMinutes?: number; 
  notes: string;
  color: string;     
  createdAt: string; // ISO date string YYYY-MM-DD
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
  content: string; // Summarized text version for search
  blocks?: NoteBlock[];
  updatedAt: string;
  createdAt: string;
}

export type AppMode = 'routines' | 'notes';
export type ViewState = 'timeline' | 'edit' | 'settings' | 'note-editor';
