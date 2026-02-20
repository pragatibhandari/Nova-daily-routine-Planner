
import { Task, RepeatOption } from '../../types';
import { getLocalDateString } from './time';

export const filterTasksByDate = (tasks: Task[], selectedDate: string): Task[] => {
  const targetDate = new Date(selectedDate);
  return tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    if (task.repeat === RepeatOption.DAILY) return true;
    if (task.repeat === RepeatOption.WEEKLY) return taskDate.getDay() === targetDate.getDay();
    if (task.repeat === RepeatOption.MONTHLY) return taskDate.getDate() === targetDate.getDate();
    return task.createdAt === selectedDate;
  }).sort((a, b) => {
    // Defensive check to avoid localeCompare on undefined
    const startA = a.startTime || '00:00';
    const startB = b.startTime || '00:00';
    return startA.localeCompare(startB);
  });
};

export const getActiveTaskId = (filteredTasks: Task[], now: Date, selectedDate: string): string | null => {
  const todayStr = getLocalDateString(now);
  if (selectedDate !== todayStr) return null;
  
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const active = filteredTasks.find(t => {
    if (!t.startTime || !t.endTime) return false;
    const [sh, sm] = t.startTime.split(':').map(Number);
    const [eh, em] = t.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return currentMins >= startMins && currentMins < endMins;
  });
  
  return active?.id || null;
};
