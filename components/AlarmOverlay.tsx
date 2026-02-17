import React from 'react';
import { Task } from '../types';

interface AlarmOverlayProps {
  task: Task;
  onDismiss: () => void;
  onSnooze: () => void;
}

const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ task, onDismiss, onSnooze }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/60 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="w-full max-w-xs bg-card-dark rounded-[40px] p-8 border border-yellow-400/20 shadow-2xl text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative size-24 rounded-[32px] bg-yellow-400 flex items-center justify-center text-background-dark shadow-2xl shadow-yellow-400/40 animate-bell-shake">
            <span className="material-symbols-outlined text-5xl fill-1">notifications_active</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-yellow-400 font-black uppercase tracking-[0.2em] text-[10px]">Active Routine</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">{task.name}</h2>
          <p className="text-slate-400 font-medium text-sm">{task.startTime} - {task.endTime}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <button 
            onClick={onDismiss}
            className="h-16 bg-yellow-400 text-background-dark font-black text-lg rounded-3xl shadow-xl shadow-yellow-400/20 active:scale-95 transition-all"
          >
            I'm Ready
          </button>
          <button 
            onClick={onSnooze}
            className="h-14 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-2xl active:scale-95 transition-all"
          >
            Snooze 5m
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmOverlay;