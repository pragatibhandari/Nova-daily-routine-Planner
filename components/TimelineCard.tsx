
import React, { useState } from 'react';
import { Task } from '../types';

interface TimelineCardProps {
  task: Task;
  onToggleAlarm: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onClick: (task: Task) => void;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ task, onToggleAlarm, onToggleSubtask, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h > 0 ? h + ' hour' + (h > 1 ? 's' : '') : ''} ${m > 0 ? m + ' min' : ''}`.trim() || 'Duration not set';
  };

  return (
    <div className="relative group animate-in fade-in slide-in-from-left-4 duration-500">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors`}></div>
      <div 
        onClick={() => onClick(task)}
        className="ml-4 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 shadow-sm py-3 px-5 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99]"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm text-primary`}>
                {task.icon}
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-wider text-primary truncate`}>
                {task.startTime} - {task.endTime}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold leading-tight truncate">{task.name}</h3>
              {hasSubtasks && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className={`size-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <span className="material-symbols-outlined text-sm text-neutral-dark">expand_more</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-dark font-medium">{calculateDuration(task.startTime, task.endTime)}</p>
          </div>
          
          <div className="flex items-center gap-3 pl-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onToggleAlarm(task.id)}
              className={`size-9 rounded-full flex items-center justify-center transition-all ${task.alarmEnabled ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 shadow-sm scale-110' : 'bg-slate-100 dark:bg-white/5 text-slate-400 opacity-60'}`}
            >
              <span className={`material-symbols-outlined text-lg ${task.alarmEnabled ? 'fill-1' : ''}`}>
                {task.alarmEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Subtasks List */}
        {expanded && hasSubtasks && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-300">
            {task.subtasks!.map((sub) => (
              <div 
                key={sub.id} 
                className="flex items-center gap-3 group/sub"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubtask(task.id, sub.id);
                }}
              >
                <div className={`size-5 rounded-md border flex items-center justify-center transition-all ${sub.completed ? 'bg-primary border-primary' : 'border-slate-300 dark:border-white/10'}`}>
                  {sub.completed && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                </div>
                <span className={`text-sm font-medium transition-all ${sub.completed ? 'text-slate-400 line-through opacity-60' : 'text-slate-700 dark:text-slate-200'}`}>
                  {sub.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineCard;
