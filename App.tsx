import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, ViewState, RepeatOption, Subtask } from './types';
import { INITIAL_TASKS } from './constants';
import DateHeader from './components/DateHeader';
import TimelineCard from './components/TimelineCard';
import TaskForm from './components/TaskForm';
import AlarmOverlay from './components/AlarmOverlay';
import { optimizeSchedule } from './geminiService';

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const subtractMinutes = (time: string, mins: number) => {
  const [h, m] = time.split(':').map(Number);
  let total = h * 60 + m - mins;
  if (total < 0) total += 1440;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('timeline');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nova_tasks');
    if (saved) return JSON.parse(saved);
    const todayStr = getLocalDateString(new Date());
    return INITIAL_TASKS.map(t => ({ ...t, createdAt: todayStr, subtasks: [] }));
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateString(new Date());
  });

  const [now, setNow] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [globalAlarmsEnabled, setGlobalAlarmsEnabled] = useState(true);
  const [productivityInsight, setProductivityInsight] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); 
    return () => clearInterval(timer);
  }, []);

  const [ringingTaskId, setRingingTaskId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRungRef = useRef<string | null>(null);
  const isAutoScrollPending = useRef(true);

  useEffect(() => {
    localStorage.setItem('nova_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
  }, []);

  useEffect(() => {
    const checkAlarms = () => {
      if (!globalAlarmsEnabled) return;
      const todayStr = getLocalDateString(now);
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      tasks.forEach(t => {
        if (!t.alarmEnabled) return;
        
        const triggerTime = subtractMinutes(t.startTime, t.alarmLeadMinutes || 0);
        
        const taskDate = new Date(t.createdAt);
        const isToday = t.createdAt === todayStr ||
                        (t.repeat === RepeatOption.DAILY) ||
                        (t.repeat === RepeatOption.WEEKLY && taskDate.getDay() === now.getDay()) ||
                        (t.repeat === RepeatOption.MONTHLY && taskDate.getDate() === now.getDate());

        if (!isToday) return;

        if (triggerTime === currentHHmm) {
          const rungId = `${t.id}_${triggerTime}_${todayStr}`;
          if (lastRungRef.current !== rungId && !ringingTaskId) {
            lastRungRef.current = rungId;
            setRingingTaskId(t.id);
            audioRef.current?.play().catch(e => console.warn("Audio play blocked", e));
          }
        }
      });
    };
    checkAlarms();
  }, [tasks, ringingTaskId, now, globalAlarmsEnabled]);

  const handleDismissAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingTaskId(null);
  };

  const handleSnoozeAlarm = () => handleDismissAlarm();

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to clear your entire schedule? This cannot be undone.")) {
      const todayStr = getLocalDateString(new Date());
      setTasks(INITIAL_TASKS.map(t => ({ ...t, createdAt: todayStr, subtasks: [] })));
    }
  };

  const fetchInsight = async () => {
    setIsOptimizing(true);
    const insight = await optimizeSchedule(JSON.stringify(tasks));
    setProductivityInsight(insight);
    setIsOptimizing(false);
  };

  const filteredTasks = useMemo(() => {
    const targetDate = new Date(selectedDate);
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      if (task.repeat === RepeatOption.DAILY) return true;
      if (task.repeat === RepeatOption.WEEKLY) return taskDate.getDay() === targetDate.getDay();
      if (task.repeat === RepeatOption.MONTHLY) return taskDate.getDate() === targetDate.getDate();
      return task.createdAt === selectedDate;
    }).sort((a, b) => {
      const startCompare = a.startTime.localeCompare(b.startTime);
      if (startCompare !== 0) return startCompare;
      return a.endTime.localeCompare(b.endTime);
    });
  }, [tasks, selectedDate]);

  const activeTaskId = useMemo(() => {
    const todayStr = getLocalDateString(now);
    if (selectedDate !== todayStr) return null;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return filteredTasks.find(t => {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (endMins > startMins) return currentMins >= startMins && currentMins < endMins;
      return currentMins >= startMins || currentMins < endMins;
    })?.id || null;
  }, [filteredTasks, selectedDate, now]);

  const calculateDuration = (start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`.trim();
  };

  const handleSetSelectedDate = (date: string) => {
    const todayStr = getLocalDateString(now);
    if (date === todayStr) isAutoScrollPending.current = true;
    setSelectedDate(date);
  };

  const handleToggleAlarm = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, alarmEnabled: !t.alarmEnabled } : t));
  }, []);

  const handleToggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setView('edit');
  };

  const handleAddNewTask = () => {
    setSelectedTask(null);
    setView('edit');
  };

  const handleSaveTask = (task: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, { ...task, createdAt: selectedDate }];
    });
    setView('timeline');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setView('timeline');
  };

  const renderTimeline = () => {
    const todayStr = getLocalDateString(now);
    const nowTotal = now.getHours() * 60 + now.getMinutes();

    return (
      <div className="flex flex-col min-h-screen pb-32 bg-background-light dark:bg-background-dark">
        <DateHeader selectedDate={selectedDate} setSelectedDate={handleSetSelectedDate} tasks={tasks} />
        <main className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-neutral-dark mb-2 uppercase tracking-widest text-[10px]">
            {selectedDate === todayStr ? "Today's Schedule" : `Schedule for ${selectedDate}`}
          </h2>
          {filteredTasks.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-50">
              <span className="material-symbols-outlined text-6xl">event_busy</span>
              <p className="font-medium">No routines found for this day</p>
              <button onClick={handleAddNewTask} className="text-primary font-bold text-sm underline">Start fresh</button>
            </div>
          ) : (
            filteredTasks.map((task, index) => {
              const nextTask = filteredTasks[index + 1];
              const [curH, curM] = task.endTime.split(':').map(Number);
              const currentEndTotal = curH * 60 + curM;
              
              let nextStartMinutes: number | null = null;
              if (nextTask) {
                const [nH, nM] = nextTask.startTime.split(':').map(Number);
                nextStartMinutes = nH * 60 + nM;
              }

              const isOvernight = parseInt(task.endTime.split(':')[0]) < parseInt(task.startTime.split(':')[0]);
              const hasGap = !isOvernight && nextTask && nextStartMinutes !== null && (nextStartMinutes - currentEndTotal >= 1);
              const hasOverlap = nextTask && nextStartMinutes !== null && (nextStartMinutes < currentEndTotal);
              
              const isOngoing = task.id === activeTaskId;
              const isGapOngoing = selectedDate === todayStr && hasGap && nextStartMinutes !== null && (nowTotal >= currentEndTotal && nowTotal < nextStartMinutes);

              return (
                <React.Fragment key={task.id}>
                  <div data-task-id={task.id} data-ongoing={isOngoing}>
                    <TimelineCard 
                      task={task} 
                      isRinging={ringingTaskId === task.id}
                      isOngoing={isOngoing}
                      onDismissAlarm={handleDismissAlarm}
                      onSnoozeAlarm={handleSnoozeAlarm}
                      onToggleAlarm={handleToggleAlarm}
                      onToggleSubtask={handleToggleSubtask}
                      onClick={handleEditTask}
                    />
                  </div>

                  {hasOverlap && (
                    <div onClick={() => handleEditTask(nextTask)} className="ml-5 flex items-center justify-between py-2.5 px-4 border border-dashed border-red-500/10 rounded-2xl cursor-pointer transition-all opacity-60 hover:opacity-100 active:scale-[0.98]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-red-500/60">error_outline</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-dark">Schedule Overlap detected</p>
                      </div>
                    </div>
                  )}

                  {hasGap && !hasOverlap && (
                    <div 
                      onClick={handleAddNewTask} 
                      className={`ml-5 relative flex items-center justify-between py-2.5 px-4 border border-dashed rounded-2xl transition-all cursor-pointer active:scale-[0.98] ${
                        isGapOngoing 
                          ? 'bg-primary/5 border-primary/30 shadow-[0_4px_12px_-4px_rgba(37,71,244,0.15)] ring-1 ring-primary/5' 
                          : 'border-slate-200 dark:border-white/5 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <div className={`absolute -left-5 top-0 bottom-0 w-1 rounded-full transition-all duration-500 ${isGapOngoing ? 'bg-primary shadow-[0_0_8px_rgba(37,71,244,0.6)] scale-y-110' : 'bg-transparent'}`}></div>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] ${isGapOngoing ? 'text-primary' : 'text-neutral-dark'}`}>
                          {isGapOngoing ? 'progress_activity' : 'history_toggle_off'}
                        </span>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isGapOngoing ? 'text-primary' : 'text-neutral-dark'}`}>
                          {task.endTime} - {nextTask.startTime} • {calculateDuration(task.endTime, nextTask.startTime)} Free Time
                        </p>
                      </div>
                      <span className={`material-symbols-outlined text-sm ${isGapOngoing ? 'text-primary' : 'text-neutral-dark'}`}>add_circle</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </main>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex flex-col min-h-screen pb-32 bg-background-light dark:bg-background-dark overflow-y-auto px-6 pt-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-neutral-dark text-sm">Personalize your Nova experience</p>
      </header>

      <section className="space-y-6">
        <div className="bg-white dark:bg-card-dark rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">account_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Nova User</h3>
              <p className="text-neutral-dark text-xs uppercase tracking-widest font-black">Free Plan</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-3xl p-4 border border-slate-200 dark:border-white/5 space-y-1 shadow-sm">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              <span className="font-bold">App Theme</span>
            </div>
            <span className="text-neutral-dark text-sm font-medium">{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>
          
          <div className="w-full flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-500">notifications_active</span>
              <span className="font-bold">Master Alarms</span>
            </div>
            <button 
              onClick={() => setGlobalAlarmsEnabled(!globalAlarmsEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative ${globalAlarmsEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-white/10'}`}
            >
              <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${globalAlarmsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h3 className="font-bold text-primary">AI Insights</h3>
            </div>
            <button 
              onClick={fetchInsight}
              disabled={isOptimizing}
              className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isOptimizing ? 'Analyzing...' : 'Analyze My Week'}
            </button>
          </div>
          {productivityInsight ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
              "{productivityInsight}"
            </p>
          ) : (
            <p className="text-xs text-neutral-dark">Get a personalized productivity tip based on your current schedule.</p>
          )}
        </div>

        <div className="bg-white dark:bg-card-dark rounded-3xl p-4 border border-slate-200 dark:border-white/5 space-y-1 shadow-sm">
          <button onClick={handleResetData} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
            <span className="material-symbols-outlined">delete_forever</span>
            <span className="font-bold">Reset All Data</span>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-dark opacity-40">Nova Routine Planner v1.0.4</p>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex justify-center bg-background-light dark:bg-background-dark min-h-screen overflow-x-hidden">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark min-h-screen relative border-x border-slate-200 dark:border-slate-800 overflow-x-hidden">
        {view === 'timeline' && renderTimeline()}
        {view === 'settings' && renderSettings()}
        {view === 'edit' && (
          <TaskForm 
            task={selectedTask} 
            onSave={handleSaveTask} 
            onBack={() => setView('timeline')} 
            onDelete={handleDeleteTask} 
            allTasks={tasks} 
            selectedDate={selectedDate}
            onGoToDate={(d) => { setSelectedDate(d); setView('timeline'); }}
          />
        )}
        
        {view !== 'edit' && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-8 pt-4">
            <div className="flex justify-between items-center px-6">
              <button onClick={() => setView('timeline')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'timeline' ? 'text-primary' : 'text-neutral-dark'}`}>
                <div className={`flex h-8 w-12 items-center justify-center rounded-full ${view === 'timeline' ? 'bg-primary/10' : ''}`}><span className="material-symbols-outlined">schedule</span></div>
                <p className="text-[10px] font-bold uppercase tracking-tighter">Timeline</p>
              </button>
              <button onClick={handleAddNewTask} className="size-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center -mt-8 border-4 border-white dark:border-background-dark hover:scale-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-3xl">add</span>
              </button>
              <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'settings' ? 'text-primary' : 'text-neutral-dark'}`}>
                <div className={`flex h-8 w-12 items-center justify-center rounded-full ${view === 'settings' ? 'bg-primary/10' : ''}`}><span className="material-symbols-outlined">settings</span></div>
                <p className="text-[10px] font-bold uppercase tracking-tighter">Settings</p>
              </button>
            </div>
          </nav>
        )}

        {ringingTaskId && (
          <AlarmOverlay 
            task={tasks.find(t => t.id === ringingTaskId)!} 
            onDismiss={handleDismissAlarm} 
            onSnooze={handleSnoozeAlarm} 
          />
        )}
      </div>
    </div>
  );
};

export default App;