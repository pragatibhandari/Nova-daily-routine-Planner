import React, { useState } from 'react';
import { Task } from '../types';

interface TimelineCardProps {
  task: Task;
  isRinging?: boolean;
  isOngoing?: boolean;
  onDismissAlarm?: () => void;
  onSnoozeAlarm?: () => void;
  onToggleAlarm: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onClick: (task: Task) => void;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ 
  task, 
  isRinging, 
  isOngoing,
  onDismissAlarm, 
  onSnoozeAlarm, 
  onToggleAlarm, 
  onToggleSubtask, 
  onClick 
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h > 0 ? h + ' hr' + (h > 1 ? 's' : '') : ''} ${m > 0 ? m + ' min' : ''}`.trim() || 'No duration';
  };

  return (
    <div className={`relative group animate-in fade-in slide-in-from-left-4 duration-500 ${isRinging ? 'z-[60]' : 'z-0'}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-full transition-all duration-500 ${
        isRinging 
          ? 'bg-yellow-400' 
          : isOngoing 
            ? 'bg-primary shadow-[0_0_12px_rgba(37,71,244,0.8)] scale-y-110' 
            : 'bg-primary/20 group-hover:bg-primary/40'
      }`}></div>
      
      <div 
        onClick={() => onClick(task)}
        className={`ml-5 bg-white dark:bg-card-dark rounded-2xl border transition-all duration-300 ${
          isRinging 
            ? 'border-yellow-400 ring-4 ring-yellow-400/20 bg-yellow-400/5' 
            : isOngoing
              ? 'border-primary/40 shadow-[0_12px_24px_-8px_rgba(37,71,244,0.15)] bg-primary/5 ring-1 ring-primary/10'
              : 'border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-white/10 active:scale-[0.99]'
        } py-4 px-5 cursor-pointer relative overflow-hidden`}
      >
        {isOngoing && (
          <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[40px] text-primary animate-pulse">pulse_alert</span>
          </div>
        )}

        <div className="flex justify-between items-center relative z-10">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${
                isRinging ? 'text-yellow-400 animate-bell-shake fill-1' : isOngoing ? 'text-primary fill-1' : 'text-primary'
              }`}>
                {task.icon}
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.05em] ${isRinging ? 'text-yellow-400' : 'text-primary'} truncate`}>
                {task.startTime} - {task.endTime}
                {isOngoing && <span className="ml-2 bg-primary/10 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-normal">Ongoing</span>}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{task.name}</h3>
              {hasSubtasks && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className={`size-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <span className="material-symbols-outlined text-sm text-neutral-dark">expand_more</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-dark font-medium flex items-center gap-1.5 opacity-80">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              {calculateDuration(task.startTime, task.endTime)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 pl-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => !isRinging && onToggleAlarm(task.id)}
              className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                isRinging 
                  ? 'bg-yellow-400 text-background-dark animate-bell-shake shadow-[0_0_15px_rgba(250,204,21,0.6)]' 
                  : task.alarmEnabled 
                    ? 'bg-yellow-500/10 text-yellow-500/30' 
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 opacity-20 hover:opacity-100'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${task.alarmEnabled || isRinging ? 'fill-1' : ''}`}>
                {isRinging ? 'notifications_active' : task.alarmEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>
          </div>
        </div>

        {isRinging && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-14 right-0 bg-yellow-400 text-background-dark p-2 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 zoom-in-90 duration-300 z-[70]"
          >
            <button onClick={onSnoozeAlarm} className="bg-background-dark/10 hover:bg-background-dark/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Snooze</button>
            <button onClick={onDismissAlarm} className="bg-background-dark text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Stop</button>
            <div className="absolute -bottom-1.5 right-6 size-3 bg-yellow-400 rotate-45"></div>
          </div>
        )}

        {expanded && hasSubtasks && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
            {task.subtasks!.map((sub) => (
              <div 
                key={sub.id} 
                className="flex items-center gap-3 group/sub"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubtask(task.id, sub.id);
                }}
              >
                <div className={`size-5 rounded-lg border flex items-center justify-center transition-all ${sub.completed ? 'bg-primary border-primary' : 'border-slate-300 dark:border-white/10'}`}>
                  {sub.completed && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
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