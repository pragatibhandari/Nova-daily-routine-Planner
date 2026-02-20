
import { timeToMins, minsToTime, subtractMinutes } from './time';
import { analyzeTimeline, TimelineItem } from './timeline';
import { filterTasksByDate } from './taskUtils';
import { Task, RepeatOption } from '../../types';

export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
}

export const runDiagnosticSuite = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, failMsg?: string) => {
    results.push({
      name,
      status: condition ? 'passed' : 'failed',
      message: condition ? undefined : failMsg
    });
  };

  // --- 1. Time Utility Tests ---
  assert('Time to Mins: Basic', timeToMins('10:30') === 630);
  assert('Time to Mins: Midnight', timeToMins('00:00') === 0);
  assert('Mins to Time: Basic', minsToTime(630) === '10:30');
  assert('Mins to Time: Last Minute', minsToTime(1439) === '23:59');
  assert('Subtract Mins: Basic', subtractMinutes('10:00', 10) === '09:50');
  assert('Subtract Mins: Wrap Around', subtractMinutes('00:05', 10) === '23:55', 'Failed midnight wrap-around');

  // --- 2. Timeline Analysis Tests ---
  const t1: Task = { id: '1', name: 'Task 1', startTime: '08:00', endTime: '09:00', createdAt: '2024-01-01', repeat: RepeatOption.NONE } as Task;
  const t2: Task = { id: '2', name: 'Task 2', startTime: '09:30', endTime: '10:30', createdAt: '2024-01-01', repeat: RepeatOption.NONE } as Task;
  const tOverlap: Task = { id: '3', name: 'Overlap', startTime: '08:30', endTime: '09:30', createdAt: '2024-01-01', repeat: RepeatOption.NONE } as Task;

  const gapAnalysis = analyzeTimeline([t1, t2]);
  const gap = gapAnalysis.find(i => i.type === 'gap');
  assert('Gap Detection: Valid Gap', !!gap && gap.type === 'gap' && gap.duration === 30, 'Should detect 30m gap');

  const overlapAnalysis = analyzeTimeline([t1, tOverlap]);
  const overlap = overlapAnalysis.find(i => i.type === 'overlap');
  assert('Overlap Detection: Conflict', !!overlap && overlap.type === 'overlap' && overlap.duration === 30, 'Should detect 30m overlap');

  const emptyAnalysis = analyzeTimeline([]);
  assert('Timeline: Empty State', emptyAnalysis.length === 0);

  // --- 3. Task Filtering Tests ---
  const tasks: Task[] = [
    { id: 'd1', name: 'Daily', startTime: '08:00', endTime: '09:00', repeat: RepeatOption.DAILY, createdAt: '2024-01-01' } as Task,
    { id: 'n1', name: 'None', startTime: '10:00', endTime: '11:00', repeat: RepeatOption.NONE, createdAt: '2024-01-01' } as Task,
    { id: 'w1', name: 'Weekly Mon', startTime: '12:00', endTime: '13:00', repeat: RepeatOption.WEEKLY, createdAt: '2024-01-01' } as Task, // Jan 1st 2024 was a Monday
  ];

  const filteredToday = filterTasksByDate(tasks, '2024-01-01');
  assert('Filter: Correct Date', filteredToday.length === 3, 'Should include all tasks on Jan 1st');

  const filteredTomorrow = filterTasksByDate(tasks, '2024-01-02');
  assert('Filter: Daily Inclusion', filteredTomorrow.some(t => t.id === 'd1'), 'Daily task missing on next day');
  assert('Filter: Weekly Exclusion', !filteredTomorrow.some(t => t.id === 'w1'), 'Weekly task shown on wrong day');
  assert('Filter: None Exclusion', !filteredTomorrow.some(t => t.id === 'n1'), 'One-time task shown on wrong day');

  // Simulating small delay for UI effect
  await new Promise(r => setTimeout(r, 600));
  return results;
};
