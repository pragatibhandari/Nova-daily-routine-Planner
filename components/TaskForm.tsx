import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  onEditTask?: (task: Task) => void;
  onGoToDate?: (date: string) => void;
}

const WheelPicker = ({ 
  value, 
  onChange, 
  options,
  isPulse = false
}: { 
  value: string, 
  onChange: (v: string) => void, 
  options: string[],
  isPulse?: boolean
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 44; 
  const isInternalUpdate = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current && !isInternalUpdate.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        // Change from direct assignment to smooth scrollTo for visual effect
        scrollRef.current.scrollTo({
          top: index * ITEM_HEIGHT,
          behavior: 'smooth'
        });
      }
    }
    isInternalUpdate.current = false;
  }, [value, options]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);

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
    <div className={`relative h-[220px] w-14 overflow-hidden transition-all duration-500 ${isPulse ? 'scale-110' : 'scale-100'}`}>
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
              className={`h-[44px] w-full flex items-center justify-center snap-center select-none transition-all duration-300 ${
                isSelected 
                  ? 'text-white font-bold text-2xl' 
                  : 'text-slate-400 text-sm opacity-20'
              } ${isSelected && isPulse ? 'text-primary' : ''}`}
            >
              {opt}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  onSave, 
  onBack, 
  onDelete, 
  allTasks, 
  selectedDate, 
  onEditTask, 
  onGoToDate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const getDefaults = () => {
    const dayTasks = allTasks
      .filter(t => t.createdAt === selectedDate)
      .sort((a, b) => a.endTime.localeCompare(b.endTime));

    const lastTask = dayTasks[dayTasks.length - 1];
    
    let startH = '10';
    let startM = '00';

    if (lastTask) {
      const [h, m] = lastTask.endTime.split(':');
      startH = h || '10';
      startM = m || '00';
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

  const [startHour, setStartHour] = useState(task?.startTime.split(':')[0] || timeDefaults.startH);
  const [startMin, setStartMin] = useState(task?.startTime.split(':')[1] || timeDefaults.startM);
  const [endHour, setEndHour] = useState(task?.endTime.split(':')[0] || timeDefaults.endH);
  const [endMin, setEndMin] = useState(task?.endTime.split(':')[1] || timeDefaults.endM);

  const getDurationComponents = useCallback(() => {
    const s = parseInt(startHour) * 60 + parseInt(startMin);
    const e = parseInt(endHour) * 60 + parseInt(endMin);
    let diff = e - s;
    if (diff <= 0) diff += 1440;
    
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { h, m, total: diff };
  }, [startHour, startMin, endHour, endMin]);

  const { h, m, total: currentTotalMins } = getDurationComponents();

  const handleStartHourChange = (newH: string) => {
    const duration = currentTotalMins;
    setStartHour(newH);
    const startTotal = parseInt(newH) * 60 + parseInt(startMin);
    const endTotal = (startTotal + duration) % 1440;
    setEndHour(Math.floor(endTotal / 60).toString().padStart(2, '0'));
    setEndMin((endTotal % 60).toString().padStart(2, '0'));
  };

  const handleStartMinChange = (newM: string) => {
    const duration = currentTotalMins;
    setStartMin(newM);
    const startTotal = parseInt(startHour) * 60 + parseInt(newM);
    const endTotal = (startTotal + duration) % 1440;
    setEndHour(Math.floor(endTotal / 60).toString().padStart(2, '0'));
    setEndMin((endTotal % 60).toString().padStart(2, '0'));
  };

  const [name, setName] = useState(task?.name || '');
  const [repeat, setRepeat] = useState<RepeatOption>(task?.repeat || RepeatOption.NONE);
  const [alarmEnabled, setAlarmEnabled] = useState(task?.alarmEnabled || false);
  const [alarmLeadMinutes, setAlarmLeadMinutes] = useState<number>(task?.alarmLeadMinutes || 0);
  const [notes, setNotes] = useState(task?.notes || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFutureTasksExpanded, setIsFutureTasksExpanded] = useState(false);
  
  const [isApplyingDuration, setIsApplyingDuration] = useState(false);
  const [isEndTimeManuallySet, setIsEndTimeManuallySet] = useState(!!task);

  useEffect(() => {
    if (task) {
      setName(task.name);
      const sParts = task.startTime.split(':');
      const eParts = task.endTime.split(':');
      if (sParts.length === 2) {
        setStartHour(sParts[0]);
        setStartMin(sParts[1]);
      }
      if (eParts.length === 2) {
        setEndHour(eParts[0]);
        setEndMin(eParts[1]);
      }
      setRepeat(task.repeat);
      setAlarmEnabled(task.alarmEnabled);
      setAlarmLeadMinutes(task.alarmLeadMinutes || 0);
      setNotes(task.notes);
      setSubtasks(task.subtasks || []);
      setIsEndTimeManuallySet(true); 
    }
  }, [task]);

  // Strict time validation: End time must be at least 1 minute after start time
  useEffect(() => {
    const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
    const endTotal = parseInt(endHour) * 60 + parseInt(endMin);
    
    if (endTotal === startTotal) {
      const newEndMins = (startTotal + 1) % 1440;
      setEndHour(Math.floor(newEndMins / 60).toString().padStart(2, '0'));
      setEndMin((newEndMins % 60).toString().padStart(2, '0'));
    }
  }, [startHour, startMin, endHour, endMin]);

  const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));

  const basePresets = [
    { label: '1m', value: 1 },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '1h', value: 60 }
  ];

  const isPresetActive = (val: number) => currentTotalMins === val;
  const isCustomDuration = !basePresets.some(p => p.value === currentTotalMins);

  const handleDurationSelect = (mins: number) => {
    // Trigger pulse visual effect
    setIsApplyingDuration(true);
    setTimeout(() => setIsApplyingDuration(false), 600);

    const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
    const endTotal = (startTotal + mins) % 1440;
    
    setEndHour(Math.floor(endTotal / 60).toString().padStart(2, '0'));
    setEndMin((endTotal % 60).toString().padStart(2, '0'));
    setIsEndTimeManuallySet(true); 
  };

  const otherOccurrences = useMemo(() => {
    if (!name.trim()) return [];
    
    const now = new Date(selectedDate);
    const twoMonthsLater = new Date(now);
    twoMonthsLater.setMonth(now.getMonth() + 2);

    const existingMatches = allTasks
      .filter(t => 
        t.name.toLowerCase() === name.toLowerCase() && 
        new Date(t.createdAt) <= twoMonthsLater &&
        t.id !== task?.id
      )
      .map(t => ({ ...t, isVirtual: false }));

    const virtuals: any[] = [];
    if (repeat !== RepeatOption.NONE) {
      const baseDate = new Date(selectedDate);
      let nextDate = new Date(baseDate);
      let iterations = 0;
      const maxIterations = 365; 

      while (iterations < maxIterations) {
        iterations++;
        if (repeat === RepeatOption.DAILY) nextDate.setDate(nextDate.getDate() + 1);
        else if (repeat === RepeatOption.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
        else if (repeat === RepeatOption.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        else break;

        if (nextDate > twoMonthsLater) break;

        const dateStr = nextDate.toISOString().split('T')[0];
        const alreadyExists = existingMatches.some(m => m.createdAt === dateStr);
        
        if (!alreadyExists) {
          virtuals.push({
            id: `virtual-${iterations}-${dateStr}`,
            name: name,
            startTime: `${startHour}:${startMin}`,
            endTime: `${endHour}:${endMin}`,
            createdAt: dateStr,
            isVirtual: true,
            repeat: repeat
          });
        }
      }
    }

    return [...existingMatches, ...virtuals].sort((a, b) => {
      const d1 = a.createdAt || '';
      const d2 = b.createdAt || '';
      const dateCompare = d1.localeCompare(d2);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [name, allTasks, repeat, selectedDate, startHour, startMin, endHour, endMin, task?.id]);

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

  const handleOccurrenceClick = (occ: any) => {
    if (onGoToDate) {
      onGoToDate(occ.createdAt);
    }
  };

  const renderDurationLabel = (label: string) => {
    const match = label.match(/(\d+(?:\.\d+)?)([mh])/);
    if (!match) return label;
    return (
      <span className="flex items-baseline gap-0.5">
        <span>{match[1]}</span>
        <span className="text-[8px] font-black uppercase opacity-60 leading-none">{match[2]}</span>
      </span>
    );
  };

  const getCustomLabel = () => {
    if (h > 0) {
      return (
        <span className="flex items-baseline gap-0.5">
          <span>{h}</span><span className="text-[8px] font-black uppercase opacity-60 leading-none">h</span>
          {m > 0 && <><span className="ml-1">{m}</span><span className="text-[8px] font-black uppercase opacity-60 leading-none">m</span></>}
        </span>
      );
    }
    return (
      <span className="flex items-baseline gap-0.5">
        <span>{m}</span><span className="text-[8px] font-black uppercase opacity-60 leading-none">m</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background-dark font-display text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 justify-between sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2 bg-card-dark px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg border border-white/5">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
          <span>{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
        </div>
        <div>
          {task && (
            <button onClick={() => onDelete(task.id)} className="size-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors">
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 pb-64 hide-scrollbar scroll-smooth">
        <section className="mt-4">
          <input 
            ref={titleInputRef}
            className="w-full bg-transparent border-none focus:ring-0 p-0 text-4xl font-bold placeholder:text-white/10 tracking-tight"
            placeholder="Routine Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold">Time</h3>
            <span className="material-symbols-outlined text-white/40 text-lg">schedule</span>
          </div>
          <div className="relative bg-card-dark/40 rounded-[32px] p-6 flex items-center justify-center border border-white/5 shadow-2xl overflow-visible">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[52px] bg-white/5 rounded-2xl border border-white/10 pointer-events-none flex items-center justify-center z-0">
              <span className={`material-symbols-outlined text-white/20 text-[20px] transition-all duration-500 ${isApplyingDuration ? 'text-primary scale-125' : ''}`}>trending_flat</span>
            </div>
            
            <div className="flex items-center justify-center z-10 w-full relative">
              <div className="flex items-center">
                <WheelPicker value={startHour} onChange={handleStartHourChange} options={hours} />
                <WheelPicker value={startMin} onChange={handleStartMinChange} options={minutes} />
              </div>
              <div className="w-16"></div>
              <div className="flex items-center">
                <WheelPicker 
                  value={endHour} 
                  onChange={(val) => { setEndHour(val); setIsEndTimeManuallySet(true); }} 
                  options={hours} 
                  isPulse={isApplyingDuration}
                />
                <WheelPicker 
                  value={endMin} 
                  onChange={(val) => { setEndMin(val); setIsEndTimeManuallySet(true); }} 
                  options={minutes} 
                  isPulse={isApplyingDuration}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-4 block px-1">Duration</label>
          <div className="bg-card-dark rounded-full p-1.5 flex items-center justify-between border border-white/5 shadow-inner">
            {basePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleDurationSelect(preset.value)}
                className={`h-11 flex-1 rounded-full text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center ${
                  isPresetActive(preset.value)
                  ? 'bg-primary text-white shadow-[0_8px_16px_-4px_rgba(37,71,244,0.4)] scale-105' 
                  : 'text-white/20 hover:text-white/50'
                }`}
              >
                {renderDurationLabel(preset.label)}
              </button>
            ))}
            
            <button
              onClick={() => isCustomDuration ? null : handleDurationSelect(90)}
              className={`h-11 flex-1 rounded-full text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center ${
                isCustomDuration 
                ? 'bg-primary text-white shadow-[0_8px_16px_-4px_rgba(37,71,244,0.4)] scale-105' 
                : 'text-white/20 hover:text-white/50'
              }`}
            >
              {isCustomDuration ? getCustomLabel() : renderDurationLabel('1.5h')}
            </button>
          </div>
        </section>

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

        <section className="mt-8 space-y-3">
          <div className={`rounded-3xl p-5 flex items-center justify-between transition-all border ${alarmEnabled ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-card-dark border-white/5'}`}>
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${alarmEnabled ? 'bg-yellow-500/40 text-yellow-100 scale-105 shadow-lg shadow-yellow-500/10' : 'bg-white/5 text-slate-400'}`}>
                <span className={`material-symbols-outlined text-2xl ${alarmEnabled ? 'fill-1' : ''}`}>notifications_active</span>
              </div>
              <div>
                <p className={`font-bold text-base ${alarmEnabled ? 'text-yellow-100' : 'text-white'}`}>Routine Alarm</p>
                <p className="text-slate-500 text-[11px] font-medium uppercase tracking-tighter">Smart Reminders</p>
              </div>
            </div>
            <Toggle checked={alarmEnabled} onChange={setAlarmEnabled} />
          </div>
        </section>

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
              placeholder="Add a step..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            />
            <button onClick={handleAddSubtask} className="size-16 bg-primary text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-xl shadow-primary/20 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        </section>

        <section className="mt-10 mb-4">
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
          <div className="bg-card-dark/40 rounded-[24px] border border-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all mb-4">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 p-5 text-sm text-white/80 font-medium placeholder:text-white/10 resize-none leading-relaxed min-h-[140px]"
              placeholder="Add extra details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Explorer Section */}
          {name.trim().length > 0 && (
            <div className="px-1 pt-2 pb-10">
              {otherOccurrences.length > 0 ? (
                <>
                  <button 
                    onClick={() => setIsFutureTasksExpanded(!isFutureTasksExpanded)}
                    className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-[0.1em] bg-primary/10 hover:bg-primary/20 px-5 py-3.5 rounded-2xl transition-all active:scale-95 w-full justify-between shadow-xl shadow-primary/5 border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">event_repeat</span>
                      <span>see other "{name}" routines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 px-2 py-0.5 rounded-lg text-[10px]">{otherOccurrences.length} total</span>
                      <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isFutureTasksExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </button>

                  {isFutureTasksExpanded && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 border-l-2 border-primary/20 ml-5 pl-6 max-h-[440px] overflow-y-auto hide-scrollbar">
                      {otherOccurrences.map((fTask, idx) => {
                        const taskDate = new Date(fTask.createdAt || '');
                        return (
                          <div 
                            key={fTask.id}
                            onClick={() => handleOccurrenceClick(fTask)}
                            className="relative group cursor-pointer"
                          >
                            <div className="absolute -left-[31px] top-6 size-2.5 rounded-full border-2 border-background-dark bg-primary/40 group-hover:bg-primary z-10 transition-colors"></div>
                            <div className="bg-card-dark/60 border border-white/5 rounded-[22px] p-4 flex items-center justify-between hover:border-primary/40 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center size-12 rounded-xl border border-white/5 bg-white/5 text-neutral-dark group-hover:bg-primary group-hover:text-white transition-colors">
                                  <span className="text-[10px] font-black uppercase leading-none mb-0.5">{taskDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                  <span className="text-sm font-black leading-none">{taskDate.getDate()}</span>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{fTask.startTime} - {fTask.endTime}</p>
                                  <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{fTask.name}</h4>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-colors text-[20px]">chevron_right</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center animate-in fade-in duration-300 border border-dashed border-white/5 rounded-[22px] opacity-30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">no other {name} recurrences</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Save Button */}
      <div className="p-6 pb-12 bg-background-dark/90 backdrop-blur-3xl border-t border-white/5 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center">
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
            alarmLeadMinutes,
            notes,
            subtasks,
            color: task?.color || '#2547f4',
            createdAt: task?.createdAt || selectedDate
          })}
          className="w-full max-w-md h-16 bg-primary hover:brightness-110 text-white font-bold rounded-[22px] shadow-[0_15px_30px_-10px_rgba(37,71,244,0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-2xl">{task ? 'check_circle' : 'add_circle'}</span>
          <span className="text-lg tracking-tight">{task ? 'Save Routine' : 'Add to Schedule'}</span>
        </button>
      </div>
    </div>
  );
};

export default TaskForm;