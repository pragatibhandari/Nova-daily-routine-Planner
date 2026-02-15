
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Task, RepeatOption, Subtask } from '../types';
import Toggle from './Toggle';
import { suggestRoutineDescription } from '../geminiService';

interface TaskFormProps {
  task: Task | null;
  onSave: (task: Task) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  allTasks: Task[];
  selectedDate: string;
}

const WheelPicker = ({ 
  value, 
  onChange, 
  options 
}: { 
  value: string, 
  onChange: (v: string) => void, 
  options: string[] 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 44; 
  const isInternalUpdate = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Sync scroll position when value changes externally
  useEffect(() => {
    if (scrollRef.current && !isInternalUpdate.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        // Use instant scroll for initial sync and external updates to avoid "slow" feeling
        scrollRef.current.scrollTop = index * ITEM_HEIGHT;
      }
    }
    isInternalUpdate.current = false;
  }, [value, options]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);

      // Reduced delay for a more responsive feel
      scrollTimeout.current = window.setTimeout(() => {
        if (scrollRef.current) {
          const index = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
          const newValue = options[index];
          if (newValue && newValue !== value) {
            isInternalUpdate.current = true;
            onChange(newValue);
          }
        }
      }, 40); 
    }
  }, [onChange, options, value]);

  return (
    <div className="relative h-[220px] w-14 overflow-hidden">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden hide-scrollbar snap-y snap-mandatory py-[88px]"
        style={{ scrollbarWidth: 'none' }}
      >
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <div 
              key={opt}
              className={`h-[44px] w-full flex items-center justify-center snap-center select-none ${
                isSelected 
                  ? 'text-white font-bold text-2xl' 
                  : 'text-slate-400 text-sm opacity-20'
              }`}
            >
              {opt}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskForm: React.FC<TaskFormProps> = ({ task, onSave, onBack, onDelete, allTasks, selectedDate }) => {
  // Determine defaults based on the last task of the day
  const getDefaults = () => {
    const dayTasks = allTasks
      .filter(t => t.createdAt === selectedDate)
      .sort((a, b) => a.endTime.localeCompare(b.endTime));

    const lastTask = dayTasks[dayTasks.length - 1];
    
    let startH = '10';
    let startM = '00';

    if (lastTask) {
      const [h, m] = lastTask.endTime.split(':');
      startH = h;
      startM = m;
    } else {
      const now = new Date();
      startH = now.getHours().toString().padStart(2, '0');
      startM = (Math.floor(now.getMinutes() / 5) * 5).toString().padStart(2, '0');
    }

    const startTotal = parseInt(startH) * 60 + parseInt(startM);
    const endTotal = (startTotal + 30) % 1440;
    const endH = Math.floor(endTotal / 60).toString().padStart(2, '0');
    const endM = (endTotal % 60).toString().padStart(2, '0');

    return { startH, startM, endH, endM };
  };

  const timeDefaults = getDefaults();

  const [name, setName] = useState(task?.name || '');
  const [startHour, setStartHour] = useState(task?.startTime.split(':')[0] || timeDefaults.startH);
  const [startMin, setStartMin] = useState(task?.startTime.split(':')[1] || timeDefaults.startM);
  const [endHour, setEndHour] = useState(task?.endTime.split(':')[0] || timeDefaults.endH);
  const [endMin, setEndMin] = useState(task?.endTime.split(':')[1] || timeDefaults.endM);
  const [repeat, setRepeat] = useState<RepeatOption>(task?.repeat || RepeatOption.NONE);
  const [alarmEnabled, setAlarmEnabled] = useState(task?.alarmEnabled || false);
  const [notes, setNotes] = useState(task?.notes || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));
  const durationPresets = ['15m', '30m', '45m', '1h', '1.5h'];

  const hasOverlap = () => {
    const currentStart = parseInt(startHour) * 60 + parseInt(startMin);
    let currentEnd = parseInt(endHour) * 60 + parseInt(endMin);
    if (currentEnd <= currentStart) currentEnd += 1440;

    return allTasks.some(t => {
      if (t.createdAt !== selectedDate) return false;
      if (task && t.id === task.id) return false;
      
      const tStart = parseInt(t.startTime.split(':')[0]) * 60 + parseInt(t.startTime.split(':')[1]);
      let tEnd = parseInt(t.endTime.split(':')[0]) * 60 + parseInt(t.endTime.split(':')[1]);
      if (tEnd <= tStart) tEnd += 1440;

      return (currentStart < tEnd && currentEnd > tStart);
    });
  };

  const getDurationString = () => {
    const s = parseInt(startHour) * 60 + parseInt(startMin);
    const e = parseInt(endHour) * 60 + parseInt(endMin);
    let diff = e - s;
    if (diff < 0) diff += 1440;
    if (diff === 60) return '1h';
    if (diff === 90) return '1.5h';
    return `${diff}m`;
  };

  const handleDurationSelect = (preset: string) => {
    const mins = preset === '15m' ? 15 : preset === '30m' ? 30 : preset === '45m' ? 45 : preset === '1h' ? 60 : 90;
    const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
    const endTotal = (startTotal + mins) % 1440;
    
    setEndHour(Math.floor(endTotal / 60).toString().padStart(2, '0'));
    setEndMin((endTotal % 60).toString().padStart(2, '0'));
  };

  const handleSuggest = async () => {
    if (!name) return;
    setIsAiLoading(true);
    const suggestion = await suggestRoutineDescription(name);
    setNotes(suggestion);
    setIsAiLoading(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { id: Math.random().toString(36).substr(2, 9), text: newSubtaskText.trim(), completed: false }]);
    setNewSubtaskText('');
  };

  const currentDurationLabel = getDurationString();
  const overlapDetected = hasOverlap();

  return (
    <div className="flex flex-col h-full bg-background-dark animate-in slide-in-from-right-10 duration-500 font-display text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 justify-between sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2 bg-card-dark px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg border border-white/5">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
          <span>{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
          <span className="material-symbols-outlined text-[16px] opacity-40">chevron_right</span>
        </div>
        <div className="flex items-center">
          {task && (
            <button onClick={() => onDelete(task.id)} className="size-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors">
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <button className="size-10 flex items-center justify-center rounded-full text-white/40">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-56 hide-scrollbar scroll-smooth">
        {/* Title input */}
        <section className="mt-4">
          <input 
            className="w-full bg-transparent border-none focus:ring-0 p-0 text-4xl font-bold placeholder:text-white/10 tracking-tight"
            placeholder="Routine Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        {/* Schedule Time Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold">Time</h3>
            <button className="text-white/40"><span className="material-symbols-outlined text-lg">schedule</span></button>
          </div>
          <div className="relative bg-card-dark/40 rounded-[32px] p-6 flex items-center justify-center overflow-hidden border border-white/5 shadow-2xl">
            {/* The Selection Overlay */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[52px] bg-white/5 rounded-2xl border border-white/10 pointer-events-none flex items-center justify-center">
              <span className="material-symbols-outlined text-white/20 text-[20px]">trending_flat</span>
            </div>
            
            <div className="flex items-center justify-center z-10 w-full relative">
              <div className="flex items-center">
                <WheelPicker value={startHour} onChange={setStartHour} options={hours} />
                <WheelPicker value={startMin} onChange={setStartMin} options={minutes} />
              </div>
              <div className="w-16"></div>
              <div className="flex items-center">
                <WheelPicker value={endHour} onChange={setEndHour} options={hours} />
                <WheelPicker value={endMin} onChange={setEndMin} options={minutes} />
              </div>
            </div>
          </div>
          {overlapDetected && (
            <div className="mt-4 px-2 flex items-center gap-2 text-red-400/80 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="material-symbols-outlined text-sm">warning</span>
              <p className="text-[11px] font-bold uppercase tracking-wider">You have overlapping schedule</p>
            </div>
          )}
        </section>

        {/* Duration section */}
        <section className="mt-8">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-4 block px-1">Duration</label>
          <div className="bg-card-dark rounded-full p-1.5 flex items-center justify-between border border-white/5 shadow-inner">
            {durationPresets.map((preset) => {
              const isSelected = currentDurationLabel === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handleDurationSelect(preset)}
                  className={`h-11 flex-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isSelected 
                    ? 'bg-primary text-white shadow-[0_8px_16px_-4px_rgba(37,71,244,0.4)] scale-105' 
                    : 'text-white/20 hover:text-white/50'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </section>

        {/* Frequency & Repeats */}
        <section className="mt-10">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-4 block px-1">Frequency</label>
          <div className="grid grid-cols-4 gap-2">
            {[RepeatOption.NONE, RepeatOption.DAILY, RepeatOption.WEEKLY, RepeatOption.MONTHLY].map(opt => (
              <button 
                key={opt}
                onClick={() => setRepeat(opt)}
                className={`py-3.5 rounded-2xl border text-[10px] font-bold transition-all ${
                  repeat === opt 
                    ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/20' 
                    : 'border-white/5 bg-card-dark text-slate-500 hover:text-white/60'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* Alarm Settings */}
        <section className={`mt-8 rounded-3xl p-5 flex items-center justify-between transition-all border ${alarmEnabled ? 'bg-primary/10 border-primary/30' : 'bg-card-dark border-white/5'}`}>
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${alarmEnabled ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400'}`}>
              <span className={`material-symbols-outlined text-2xl ${alarmEnabled ? 'fill-1' : ''}`}>notifications_active</span>
            </div>
            <div>
              <p className={`font-bold text-base ${alarmEnabled ? 'text-primary' : 'text-white'}`}>Routine Alarm</p>
              <p className="text-slate-500 text-[11px] font-medium uppercase tracking-tighter">Smart Reminders</p>
            </div>
          </div>
          <Toggle checked={alarmEnabled} onChange={setAlarmEnabled} />
        </section>

        {/* Sub-routines Builder */}
        <section className="mt-10">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-5 block px-1">Sub-routines</label>
          <div className="space-y-3 mb-6">
            {subtasks.map(s => (
              <div key={s.id} className="bg-card-dark/60 p-4 rounded-2xl flex items-center justify-between border border-white/5 group transition-all hover:border-white/20">
                <span className="text-sm text-white/80 font-medium">{s.text}</span>
                <button onClick={() => setSubtasks(subtasks.filter(x => x.id !== s.id))} className="text-white/10 hover:text-red-400 transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input 
              className="flex-1 bg-card-dark border border-white/5 rounded-2xl px-6 text-sm text-white h-16 outline-none focus:ring-2 focus:ring-primary/30 font-medium placeholder:text-white/10 transition-all"
              placeholder="Add a step to this routine..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            />
            <button onClick={handleAddSubtask} className="size-16 bg-primary text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-xl shadow-primary/20 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        </section>

        {/* Notes & Description */}
        <section className="mt-10 mb-12">
          <div className="flex justify-between items-center mb-4 px-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark">Notes & Details</label>
            <button 
              onClick={handleSuggest} 
              disabled={isAiLoading || !name}
              className={`text-primary text-[10px] font-bold uppercase flex items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-full border border-primary/10 transition-all ${isAiLoading ? 'opacity-50' : 'hover:bg-primary/20'}`}
            >
              <span className={`material-symbols-outlined text-[16px] ${isAiLoading ? 'animate-spin' : ''}`}>
                {isAiLoading ? 'progress_activity' : 'auto_awesome'}
              </span> 
              AI Suggest
            </button>
          </div>
          <div className="bg-card-dark/40 rounded-[24px] border border-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 p-5 text-sm text-white/80 font-medium placeholder:text-white/10 resize-none leading-relaxed min-h-[140px]"
              placeholder="Add any extra details, focus points, or specific instructions for this routine..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>
      </div>

      {/* Footer Save Button */}
      <div className="p-6 pb-12 bg-background-dark/90 backdrop-blur-3xl border-t border-white/5 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <button 
            onClick={() => onSave({
              id: task?.id || Math.random().toString(36).substr(2, 9),
              name: name.trim() || 'Untitled Routine',
              startTime: `${startHour}:${startMin}`,
              endTime: `${endHour}:${endMin}`,
              icon: task?.icon || 'event_note',
              isActive: task?.isActive ?? true,
              repeat,
              alarmEnabled,
              notes,
              subtasks,
              color: task?.color || '#2547f4',
              createdAt: task?.createdAt || selectedDate
            })}
            className="w-full h-16 bg-primary hover:brightness-110 text-white font-bold rounded-[22px] shadow-[0_15px_30px_-10px_rgba(37,71,244,0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-2xl animate-pulse">{task ? 'check_circle' : 'rocket_launch'}</span>
            <span className="text-lg tracking-tight">{task ? 'Save Routine' : 'Add to Schedule'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
