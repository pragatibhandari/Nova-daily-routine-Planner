
import { Task, RepeatOption } from './types';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    name: 'Morning Routine',
    startTime: '06:00',
    endTime: '08:00',
    icon: 'wb_sunny',
    isActive: true,
    repeat: RepeatOption.DAILY,
    alarmEnabled: true,
    notes: 'Coffee, stretch, and light reading.',
    color: '#2547f4',
    // Added missing required createdAt property to fix type error
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Deep Work',
    startTime: '09:00',
    endTime: '12:00',
    icon: 'terminal',
    isActive: false,
    repeat: RepeatOption.WEEKLY,
    alarmEnabled: false,
    notes: 'Focus on core development tasks.',
    color: '#909acb',
    // Added missing required createdAt property to fix type error
    createdAt: '2024-01-01'
  },
  {
    id: '3',
    name: 'Gym Session',
    startTime: '12:00',
    endTime: '13:00',
    icon: 'fitness_center',
    isActive: true,
    repeat: RepeatOption.DAILY,
    alarmEnabled: true,
    notes: 'Push day routine.',
    color: '#909acb',
    // Added missing required createdAt property to fix type error
    createdAt: '2024-01-01'
  }
];

export const DURATION_OPTIONS: string[] = ['15m', '30m', '45m', '1h', '2h'];
