
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Task, RepeatOption, Subtask } from '../types';
import Toggle from './Toggle';
import { suggestRoutineDescription } from '../geminiService';

interface TaskFormProps {
  task: Task | null;
  prefillStart?: string;
  prefillEnd?: string;
  onSave: (task: Task) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  allTasks: Task[];
  selectedDate: string;
  onEditTask?: (task: Task) => void;
  onGoToDate?: (date: string) => void;
}

const cleanTitle = (str: string) => {
  if (!str) return '';
  return str
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .toLowerCase()
    .trim();
};

// Added helper function to format date as YYYY-MM-DD
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WheelPicker = ({ 
  value, 
  onChange, 
  options,
  isPulse = false,
  disabledOptions = []
}: { 
  value: string, 
  onChange: (v: string) => void, 
  options: string[],
  isPulse?: boolean,
  disabledOptions?: string[]
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 44; 
  const isInternalUpdate = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const isInitialized = useRef(false);

  const scrollToValue = useCallback((val: string, behavior: ScrollBehavior = 'auto') => {
    if (scrollRef.current) {
      const index = options.indexOf(val);
      if (index === -1) return;
      
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior
      });
    }
  }, [options]);

  useEffect(() => {
    if (!isInitialized.current) {
      scrollToValue(value, 'auto');
      isInitialized.current = true;
    } else if (!isInternalUpdate.current) {
      scrollToValue(value, 'smooth');
    }
    isInternalUpdate.current = false;
  }, [value, scrollToValue]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        if (scrollRef.current) {
          const scrollTop = scrollRef.current.scrollTop;
          const index = Math.round(scrollTop / ITEM_HEIGHT);
          const actualValue = options[index];
          if (actualValue && actualValue !== value) {
            if (disabledOptions.includes(actualValue)) {
              scrollToValue(value, 'smooth');
            } else {
              isInternalUpdate.current = true;
              onChange(actualValue);
            }
          }
        }
      }, 50); 
    }
  }, [onChange, value, options, disabledOptions, scrollToValue]);

  return (
    <div className={`relative h-[180px] w-12 overflow-hidden transition-transform duration-500 ${isPulse ? 'scale-110' : 'scale-100'}`}>
      <div className="absolute top-1/2 left-0 right-0 h-[44px] -translate-y-1/2 bg-primary/5 dark:bg-primary/10 rounded-lg pointer-events-none border-y border-primary/10 dark:border-white/5" />
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden hide-scrollbar snap-y snap-mandatory py-[68px] overscroll-contain"
        style={{ scrollbarWidth: 'none', fontVariantNumeric: 'tabular-nums', willChange: 'transform' }}
      >
        {options.map((opt, i) => {
          const isSelected = value === opt;
          const isDisabled = disabledOptions.includes(opt);
          return (
            <div 
              key={`${opt}-${i}`}
              className={`h-[44px] w-full flex items-center justify-center snap-center select-none transition-all duration-300 ${
                isSelected 
                  ? 'text-slate-900 dark:text-white font-bold text-xl scale-110' 
                  : isDisabled 
                    ? 'text-red-500/20 text-xs grayscale blur-[0.5px]'
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
  prefillStart,
  prefillEnd,
  onSave, 
  onBack, 
  onDelete, 
  allTasks, 
  selectedDate, 
  onEditTask, 
  onGoToDate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  const timeDefaults = useMemo(() => {
    if (prefillStart && prefillEnd) {
      const [sh, sm] = prefillStart.split(':');
      const [eh, em] = prefillEnd.split(':');
      return { startH: sh, startM: sm, endH: eh, endM: em };
    }

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
  }, [allTasks, selectedDate, prefillStart, prefillEnd]);

  const [startHour, setStartHour] = useState(task?.startTime.split(':')[0] || timeDefaults.startH);
  const [startMin, setStartMin] = useState(task?.startTime.split(':')[1] || timeDefaults.startM);
  const [endHour, setEndHour] = useState(task?.endTime.split(':')[0] || timeDefaults.endH);
  const [endMin, setEndMin] = useState(task?.endTime.split(':')[1] || timeDefaults.endM);
  const [name, setName] = useState(task?.name || '');
  const [icon, setIcon] = useState(task?.icon || 'event_note');
  const [repeat, setRepeat] = useState<RepeatOption>(task?.repeat || RepeatOption.NONE);
  const [alarmEnabled, setAlarmEnabled] = useState(task?.alarmEnabled || false);
  const [alarmLeadMinutes, setAlarmLeadMinutes] = useState<number>(task?.alarmLeadMinutes || 0);
  const [notes, setNotes] = useState(task?.notes || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isApplyingDuration, setIsApplyingDuration] = useState(false);

  const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));

  const validateAndSetEndTime = useCallback((h: string, m: string) => {
    const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
    let endTotal = parseInt(h) * 60 + parseInt(m);
    if (endTotal <= startTotal) { endTotal = (startTotal + 1) % 1440; }
    setEndHour(Math.floor(endTotal / 60).toString().padStart(2, '0'));
    setEndMin((endTotal % 60).toString().padStart(2, '0'));
  }, [startHour, startMin]);

  const handleStartHourChange = (newH: string) => {
    const sMins = parseInt(startHour) * 60 + parseInt(startMin);
    const eMins = parseInt(endHour) * 60 + parseInt(endMin);
    let duration = eMins - sMins;
    if (duration <= 0) duration += 1440;
    setStartHour(newH);
    const newStartTotal = parseInt(newH) * 60 + parseInt(startMin);
    const newEndTotal = (newStartTotal + duration) % 1440;
    setEndHour(Math.floor(newEndTotal / 60).toString().padStart(2, '0'));
    setEndMin((newEndTotal % 60).toString().padStart(2, '0'));
  };

  const handleStartMinChange = (newM: string) => {
    const sMins = parseInt(startHour) * 60 + parseInt(startMin);
    const eMins = parseInt(endHour) * 60 + parseInt(endMin);
    let duration = eMins - sMins;
    if (duration <= 0) duration += 1440;
    setStartMin(newM);
    const newStartTotal = parseInt(startHour) * 60 + parseInt(newM);
    const newEndTotal = (newStartTotal + duration) % 1440;
    setEndHour(Math.floor(newEndTotal / 60).toString().padStart(2, '0'));
    setEndMin((newEndTotal % 60).toString().padStart(2, '0'));
  };

  const lockedEndHours = useMemo(() => {
    const startH = parseInt(startHour);
    return hours.filter(h => parseInt(h) < startH);
  }, [startHour, hours]);

  const lockedEndMinutes = useMemo(() => {
    const startH = parseInt(startHour);
    const endH = parseInt(endHour);
    const startM = parseInt(startMin);
    if (endH === startH) { return minutes.filter(m => parseInt(m) <= startM); }
    return [];
  }, [startHour, endHour, startMin, minutes]);

  const { h: curH, m: curM, total: currentTotalMins } = useMemo(() => {
    const s = parseInt(startHour) * 60 + parseInt(startMin);
    const e = parseInt(endHour) * 60 + parseInt(endMin);
    let diff = e - s;
    if (diff <= 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { h, m, total: diff };
  }, [startHour, startMin, endHour, endMin]);

  const recommendations = useMemo(() => {
    const taskGroups = new Map<string, { count: number, icon: string, lastUsed: string, duration: number, originalName: string }>();
    allTasks.forEach(t => {
      const base = cleanTitle(t.name);
      if (!base) return;
      const existing = taskGroups.get(base) || { count: 0, icon: t.icon, lastUsed: t.createdAt, duration: 30, originalName: t.name };
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      let dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur < 0) dur += 1440;
      taskGroups.set(base, {
        count: existing.count + 1,
        icon: t.icon,
        lastUsed: t.createdAt > existing.lastUsed ? t.createdAt : existing.lastUsed,
        duration: dur,
        originalName: t.name
      });
    });
    const searchStr = cleanTitle(name);
    let entries = Array.from(taskGroups.entries()).map(([base, data]) => ({ name: data.originalName, ...data }));
    if (searchStr.length > 0) {
      entries = entries.filter(e => cleanTitle(e.name).includes(searchStr));
      return entries.sort((a, b) => b.count - a.count);
    } else {
      entries.sort((a, b) => b.count - a.count);
      return entries.slice(0, 10);
    }
  }, [allTasks, name]);

  const siblingTasks = useMemo(() => {
    const currentCleanName = cleanTitle(name);
    if (!currentCleanName) return [];
    const nowStr = getLocalDateString(new Date());
    const currentHHmm = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    const instances: Array<{ date: string, startTime: string, endTime: string, id: string }> = [];
    allTasks.forEach(t => {
      if (cleanTitle(t.name) !== currentCleanName) return;
      const baseDate = new Date(t.createdAt);
      for (let i = 0; i < 60; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dateStr = getLocalDateString(d);
        let isMatch = false;
        if (t.repeat === RepeatOption.NONE) isMatch = i === 0;
        else if (t.repeat === RepeatOption.DAILY) isMatch = true;
        else if (t.repeat === RepeatOption.WEEKLY) isMatch = d.getDay() === baseDate.getDay();
        else if (t.repeat === RepeatOption.MONTHLY) isMatch = d.getDate() === baseDate.getDate();
        if (isMatch) {
          if (dateStr > nowStr || (dateStr === nowStr && t.startTime >= currentHHmm)) {
             if (!instances.some(inst => inst.date === dateStr && inst.startTime === t.startTime)) {
                instances.push({ date: dateStr, startTime: t.startTime, endTime: t.endTime, id: `${t.id}_${dateStr}` });
             }
          }
        }
      }
    });
    return instances.sort((a, b) => { if (a.date !== b.date) return a.date.localeCompare(b.date); return a.startTime.localeCompare(b.startTime); }).slice(0, 20);
  }, [allTasks, name]);

  const handleApplyRecommendation = (rec: any) => {
    setName(rec.name);
    setIcon(rec.icon);
    const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
    const endTotal = (startTotal + rec.duration) % 1440;
    setEndHour(Math.floor(endTotal / 60).toString().padStart(2, '0'));
    setEndMin((endTotal % 60).toString().padStart(2, '0'));
    if (titleInputRef.current) titleInputRef.current.focus();
  };

  const durationPresets = useMemo(() => {
    const fixed = [{ label: '1m', value: 1 }, { label: '15m', value: 15 }, { label: '30m', value: 30 }, { label: '45m', value: 45 }];
    const isMatched = fixed.some(p => p.value === currentTotalMins);
    if (!isMatched) {
      const label = curH > 0 ? `${curH}h${curM > 0 ? ` ${curM}m` : ''}` : `${curM}m`;
      return [...fixed, { label, value: currentTotalMins }];
    } else { return [...fixed, { label: '1h', value: 60 }]; }
  }, [currentTotalMins, curH, curM]);

  const handleDurationSelect = (mins: number) => {
    setIsApplyingDuration(true);
    setTimeout(() => setIsApplyingDuration(false), 600);
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

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden w-full max-w-full">
      <div className="flex items-center p-4 justify-between sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md w-full overflow-hidden">
        <button onClick={onBack} className="size-10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/5 rounded-full transition-colors active:scale-90 shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2 bg-white dark:bg-card-dark px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0">calendar_today</span>
          <span className="truncate">{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
        </div>
        {task ? (
          <button onClick={() => onDelete(task.id)} className="size-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors shrink-0">
            <span className="material-symbols-outlined">delete</span>
          </button>
        ) : <div className="size-10 shrink-0" />}
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-64 hide-scrollbar scroll-smooth w-full">
        <section className="mt-4 w-full">
          <div className="flex items-start gap-4 mb-2 w-full">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0"><span className="material-symbols-outlined text-3xl">{icon}</span></div>
            <textarea ref={titleInputRef} rows={2} maxLength={25} className="flex-1 bg-transparent border-none focus:ring-0 p-0 pt-1 text-3xl font-bold placeholder:text-slate-300 dark:placeholder:text-white/10 tracking-tight text-slate-900 dark:text-white resize-none leading-tight overflow-hidden" placeholder="Routine Title" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {recommendations.length > 0 && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-500 w-full overflow-hidden">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 block px-1">Recent history</label>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {recommendations.map((rec) => (
                  <button key={rec.originalName} onClick={() => handleApplyRecommendation(rec)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-2xl whitespace-nowrap hover:border-primary/40 transition-all active:scale-95 shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">{rec.icon}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-white/80">{rec.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        <section className="mt-10 w-full">
          <div className="flex items-center justify-between mb-4 px-1"><h3 className="text-xl font-bold">Time</h3><span className="material-symbols-outlined text-neutral-dark dark:text-white/40 text-lg">schedule</span></div>
          <div className="flex items-center gap-3 w-full overflow-hidden">
            <div className="flex-1 bg-white dark:bg-card-dark/40 rounded-[32px] p-4 border border-slate-200 dark:border-white/5 shadow-xl flex flex-col items-center min-w-0">
              <div className="flex items-center justify-center w-full">
                <WheelPicker value={startHour} onChange={handleStartHourChange} options={hours} />
                <WheelPicker value={startMin} onChange={handleStartMinChange} options={minutes} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 shrink-0">
              <div className={`px-3 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg transition-all duration-500 ${isApplyingDuration ? 'scale-110 shadow-primary/40' : 'scale-100'}`}>
                {curH > 0 ? `${curH}h ${curM}m` : `${curM}m`}
              </div>
              <div className="h-20 w-[1px] bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent"></div>
            </div>
            <div className="flex-1 bg-white dark:bg-card-dark/40 rounded-[32px] p-4 border border-slate-200 dark:border-white/5 shadow-xl flex flex-col items-center min-w-0">
              <div className="flex items-center justify-center w-full">
                <WheelPicker value={endHour} onChange={(val) => validateAndSetEndTime(val, endMin)} options={hours} isPulse={isApplyingDuration} disabledOptions={lockedEndHours} />
                <WheelPicker value={endMin} onChange={(val) => validateAndSetEndTime(endHour, val)} options={minutes} isPulse={isApplyingDuration} disabledOptions={lockedEndMinutes} />
              </div>
            </div>
          </div>
        </section>
        <section className="mt-8 w-full overflow-hidden">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-4 block px-1">Duration Presets</label>
          <div className="bg-white dark:bg-card-dark rounded-full p-1.5 flex items-center justify-between border border-slate-200 dark:border-white/5 shadow-inner w-full">
            {durationPresets.map((preset) => (
              <button key={preset.label} onClick={() => handleDurationSelect(preset.value)} className={`h-11 flex-1 rounded-full text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center ${currentTotalMins === preset.value ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-white/20 hover:text-primary dark:hover:text-white/50'}`}>{preset.label}</button>
            ))}
          </div>
        </section>
        <section className="mt-10 w-full overflow-hidden">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-4 block px-1">Frequency</label>
          <div className="grid grid-cols-4 gap-2 w-full">
            {[RepeatOption.NONE, RepeatOption.DAILY, RepeatOption.WEEKLY, RepeatOption.MONTHLY].map(opt => (
              <button key={opt} onClick={() => setRepeat(opt)} className={`py-3.5 rounded-2xl border text-[10px] font-bold transition-all ${repeat === opt ? 'bg-primary text-white border-transparent shadow-lg' : 'border-slate-200 dark:border-white/5 bg-white dark:bg-card-dark text-slate-500 hover:text-primary dark:hover:text-white/60'}`}>{opt}</button>
            ))}
          </div>
        </section>
        <section className="mt-10 w-full overflow-hidden">
          <div className={`rounded-3xl p-5 transition-all border ${alarmEnabled ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.05)]' : 'bg-white dark:bg-card-dark border-slate-200 dark:border-white/5'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`size-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${alarmEnabled ? 'bg-yellow-500 text-slate-900 dark:text-background-dark shadow-xl' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}><span className={`material-symbols-outlined text-2xl ${alarmEnabled ? 'fill-1' : ''}`}>notifications_active</span></div>
                <div className="overflow-hidden"><p className={`font-bold text-base truncate ${alarmEnabled ? 'text-yellow-600 dark:text-yellow-500' : 'text-slate-900 dark:text-white'}`}>Routine Alarm</p><p className="text-slate-500 text-[11px] font-medium uppercase tracking-tighter truncate">Notification system</p></div>
              </div>
              <Toggle checked={alarmEnabled} onChange={setAlarmEnabled} />
            </div>
            {alarmEnabled && (
              <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-500/80 mb-3 block px-1">Remind me</label>
                <div className="flex gap-2 w-full">{[0, 5, 10].map((mins) => (<button key={mins} onClick={() => setAlarmLeadMinutes(mins)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${alarmLeadMinutes === mins ? 'bg-yellow-500 text-slate-900 dark:text-background-dark border-transparent shadow-lg scale-[1.03] z-10' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white/60'}`}>{mins === 0 ? 'At Start' : `${mins}m Before`}</button>))}</div>
              </div>
            )}
          </div>
        </section>
        <section className="mt-10 w-full overflow-hidden">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark mb-5 block px-1">Steps / Sub-routines</label>
          <div className="space-y-3 mb-6 w-full">{subtasks.map(s => (<div key={s.id} className="bg-white dark:bg-card-dark/60 p-4 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-white/5 group transition-all hover:border-primary/30 w-full overflow-hidden"><span className="text-sm text-slate-700 dark:text-white/80 font-medium truncate flex-1 pr-4">{s.text}</span><button onClick={() => setSubtasks(subtasks.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-400 transition-colors shrink-0"><span className="material-symbols-outlined text-xl">close</span></button></div>))}</div>
          <div className="flex gap-3 w-full"><input className="flex-1 bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-2xl px-6 text-sm text-slate-900 dark:text-white h-16 outline-none focus:ring-2 focus:ring-primary/30 font-medium placeholder:text-slate-300 dark:placeholder:text-white/10 w-full min-w-0" placeholder="Add a step..." value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} /><button onClick={handleAddSubtask} className="size-16 bg-primary text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-xl transition-all shrink-0"><span className="material-symbols-outlined text-3xl">add</span></button></div>
        </section>
        <section className="mt-10 mb-4 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 px-1 gap-2"><label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark whitespace-nowrap">Notes & Guidance</label><button onClick={handleSuggest} disabled={isAiLoading || !name} className={`text-primary text-[10px] font-bold uppercase flex items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-full border border-primary/10 transition-all shrink-0 ${isAiLoading ? 'opacity-50' : 'hover:bg-primary/20'}`}><span className={`material-symbols-outlined text-[16px] ${isAiLoading ? 'animate-spin' : ''}`}>{isAiLoading ? 'progress_activity' : 'auto_awesome'}</span> AI Suggest</button></div>
          <div className="bg-white dark:bg-card-dark/40 rounded-[24px] border border-slate-200 dark:border-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all mb-4 w-full"><textarea className="w-full bg-transparent border-none focus:ring-0 p-5 text-sm text-slate-700 dark:text-white/80 font-medium placeholder:text-slate-300 dark:placeholder:text-white/10 resize-none leading-relaxed min-h-[140px]" placeholder="Add extra details..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </section>
        {siblingTasks.length > 0 && (
          <section className="mt-10 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1 gap-2"><label className="text-[10px] font-bold uppercase tracking-widest text-neutral-dark truncate max-w-[70%]">Upcoming "{name || 'Routine'}"</label><span className="text-[10px] font-black text-primary/40 uppercase tracking-widest whitespace-nowrap">{siblingTasks.length} Found</span></div>
            <div className="bg-white dark:bg-card-dark/20 rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden max-h-[350px] overflow-y-auto hide-scrollbar scroll-smooth w-full">{siblingTasks.map((sibling) => (<button key={sibling.id} onClick={() => onGoToDate?.(sibling.date)} className="w-full flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5 last:border-none hover:bg-slate-50 dark:hover:bg-white/5 transition-all group active:scale-[0.98] overflow-hidden"><div className="flex flex-col items-start text-left gap-1 overflow-hidden"><p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors truncate w-full">{formatDateLabel(sibling.date)}</p><p className="text-[10px] font-black text-neutral-dark uppercase tracking-wider truncate w-full">{sibling.startTime} — {sibling.endTime}</p></div><span className="material-symbols-outlined text-neutral-dark/30 dark:text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0">arrow_forward_ios</span></button>))}</div>
            <p className="mt-4 text-center text-[10px] font-medium text-neutral-dark/40 uppercase tracking-[0.15em] w-full">Showing next 20 scheduled instances</p>
          </section>
        )}
      </div>
      <div className="p-6 pb-12 bg-white/90 dark:bg-background-dark/90 backdrop-blur-3xl border-t border-slate-200 dark:border-white/5 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center overflow-hidden">
        <button onClick={() => onSave({ id: task?.id || Math.random().toString(36).substr(2, 9), name: name.trim() || 'Untitled Routine', startTime: `${startHour}:${startMin}`, endTime: `${endHour}:${endMin}`, icon: icon, isActive: task?.isActive ?? true, repeat, alarmEnabled, alarmLeadMinutes, notes, subtasks, color: task?.color || '#2547f4', createdAt: task?.createdAt || selectedDate })} className="w-full max-w-md h-16 bg-primary hover:brightness-110 text-white font-bold rounded-[22px] shadow-[0_15px_30px_-10px_rgba(37,71,244,0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 overflow-hidden"><span className="material-symbols-outlined text-2xl shrink-0">{task ? 'check_circle' : 'add_circle'}</span><span className="text-lg tracking-tight truncate">{task ? 'Update Routine' : 'Create Routine'}</span></button>
      </div>
    </div>
  );
};

export default TaskForm;
