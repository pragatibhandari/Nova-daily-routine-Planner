
import { Task } from '../../types';
import { timeToMins } from './time';

export type TimelineItem = 
  | { type: 'task'; data: Task }
  | { type: 'gap'; start: string; end: string; duration: number }
  | { type: 'overlap'; start: string; end: string; duration: number };

export const analyzeTimeline = (tasks: Task[]): TimelineItem[] => {
  if (tasks.length === 0) return [];
  
  const sorted = [...tasks].sort((a, b) => {
    const startA = a.startTime || '00:00';
    const startB = b.startTime || '00:00';
    return startA.localeCompare(startB);
  });
  
  const items: TimelineItem[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    items.push({ type: 'task', data: current });

    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      // Defensive defaults for potential missing times
      const currentEnd = timeToMins(current.endTime || '00:00');
      const nextStart = timeToMins(next.startTime || '00:00');

      if (currentEnd < nextStart) {
        items.push({ 
          type: 'gap', 
          start: current.endTime || '00:00', 
          end: next.startTime || '00:00', 
          duration: nextStart - currentEnd 
        });
      } else if (currentEnd > nextStart) {
        items.push({ 
          type: 'overlap', 
          start: next.startTime || '00:00', 
          end: current.endTime || '00:00', 
          duration: currentEnd - nextStart 
        });
      }
    }
  }
  return items;
};
