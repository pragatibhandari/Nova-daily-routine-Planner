
import React from 'react';
import { Task } from '../types';

interface AlarmOverlayProps {
  task: Task;
  onDismiss: () => void;
}

const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ task, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-background-dark/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <div className="size-32 rounded-[40px] bg-primary flex items-center justify-center shadow-[0_0_80px_rgba(37,71,244,0.4)] mb-10 animate-bounce">
          <span className="material-symbols-outlined text-6xl text-white fill-1">notifications_active</span>
        </div>

        <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Routine Starting Now</h2>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight leading-tight">{task.name}</h1>
        <p className="text-white/40 font-medium text-lg mb-12">{task.startTime} — {task.endTime}</p>

        <div className="w-full space-y-4">
          <button 
            onClick={onDismiss}
            className="w-full h-18 bg-white text-background-dark font-black text-lg rounded-[24px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-2xl">stop_circle</span>
            Dismiss Alarm
          </button>
          
          <button 
            onClick={onDismiss}
            className="w-full h-18 bg-white/5 text-white/60 font-bold text-base rounded-[24px] border border-white/10 active:scale-[0.98] transition-all hover:bg-white/10"
          >
            Snooze 5 mins
          </button>
        </div>
      </div>
      
      {/* Visual background elements */}
      <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center opacity-20">
        <span className="text-[100px] font-black text-white/5 select-none tracking-tighter uppercase italic">GET READY</span>
      </div>
    </div>
  );
};

export default AlarmOverlay;
