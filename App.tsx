import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, ViewState, RepeatOption, Subtask } from './types';
import { INITIAL_TASKS } from './constants';
import DateHeader from './components/DateHeader';
import TimelineCard from './components/TimelineCard';
import TaskForm from './components/TaskForm';

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
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
      const todayStr = getLocalDateString(now);
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      tasks.forEach(t => {
        if (!t.alarmEnabled) return;
        const taskDate = new Date(t.createdAt);
        const isToday = t.createdAt === todayStr ||
                        (t.repeat === RepeatOption.DAILY) ||
                        (t.repeat === RepeatOption.WEEKLY && taskDate.getDay() === now.getDay()) ||
                        (t.repeat === RepeatOption.MONTHLY && taskDate.getDate() === now.getDate());

        if (!isToday) return;

        if (t.startTime === currentHHmm) {
          const rungId = `${t.id}_main_${currentHHmm}`;
          if (lastRungRef.current !== rungId && !ringingTaskId) {
            lastRungRef.current = rungId;
            setRingingTaskId(t.id);
            audioRef.current?.play().catch(e => console.warn("Audio play blocked", e));
          }
        }
      });
    };
    checkAlarms();
  }, [tasks, ringingTaskId, now]);

  const handleDismissAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingTaskId(null);
  };

  const handleSnoozeAlarm = () => handleDismissAlarm();

  const filteredTasks = useMemo(() => {
    const targetDate = new Date(selectedDate);
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      if (task.repeat === RepeatOption.DAILY) return true;
      if (task.repeat === RepeatOption.WEEKLY) return taskDate.getDay() === targetDate.getDay();
      if (task.repeat === RepeatOption.MONTHLY) return taskDate.getDate() === targetDate.getDate();
      return task.createdAt === selectedDate;
    }).sort((a, b) => {
      // Primary sort: Start Time
      const startCompare = a.startTime.localeCompare(b.startTime);
      if (startCompare !== 0) return startCompare;
      // Secondary sort: Finish Time (earliest finish first for same-start overlaps)
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

      if (endMins > startMins) {
        return currentMins >= startMins && currentMins < endMins;
      } else {
        return currentMins >= startMins || currentMins < endMins;
      }
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

  useEffect(() => {
    if (view === 'timeline' && isAutoScrollPending.current) {
      const timer = setTimeout(() => {
        const ongoingEl = document.querySelector('[data-ongoing="true"]');
        if (ongoingEl) {
          ongoingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          isAutoScrollPending.current = false;
        } else if (filteredTasks.length > 0) {
          const el = document.querySelector(`[data-task-id="${filteredTasks[0].id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            isAutoScrollPending.current = false;
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [view, selectedDate, filteredTasks]);

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

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setView('edit');
  };

  const handleGoToDate = (date: string) => {
    handleSetSelectedDate(date);
    setView('timeline');
    setSelectedTask(null);
  };

  const handleAddNewTask = () => {
    setSelectedTask(null);
    setView('edit');
  };

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    const lastTask = filteredTasks[filteredTasks.length - 1];
    const isLateEnd = lastTask ? parseInt(lastTask.endTime.split(':')[0]) >= 22 : false;

    return (
      <div className="flex flex-col min-h-screen pb-32 bg-background-light dark:bg-background-dark">
        <DateHeader selectedDate={selectedDate} setSelectedDate={handleSetSelectedDate} tasks={tasks} />
        <main className="flex-1 px-6 py-4 space-y-4">
          <h2 className="text-lg font-bold text-neutral-dark mb-2 uppercase tracking-widest text-[10px]">
            {selectedDate === todayStr ? "Today's Schedule" : `Schedule for ${selectedDate}`}
          </h2>
          {filteredTasks.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-50">
              <span className="material-symbols-outlined text-6xl">event_busy</span>
              <p className="font-medium">No routine tasks for this day</p>
              <button onClick={handleAddNewTask} className="text-primary font-bold text-sm underline">Add a task</button>
            </div>
          ) : (
            <>
              {filteredTasks.map((task, index) => {
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
                        data-ongoing={isGapOngoing}
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
              })}
              <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-40">
                <span className="material-symbols-outlined text-3xl">{isLateEnd ? 'nights_stay' : 'bedtime'}</span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{isLateEnd ? 'Good night, Sleep tight' : 'Rest of the day looks clear'}</p>
              </div>
            </>
          )}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-8 pt-4">
          <div className="max-w-md mx-auto flex justify-between items-center px-6">
            <button onClick={() => setView('timeline')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'timeline' ? 'text-primary' : 'text-neutral-dark'}`}>
              <div className={`flex h-8 w-12 items-center justify-center rounded-full ${view === 'timeline' ? 'bg-primary/10' : ''}`}><span className="material-symbols-outlined">schedule</span></div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Timeline</p>
            </button>
            <button onClick={handleAddNewTask} className="size-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center -mt-8 border-4 border-white dark:border-background-dark"><span className="material-symbols-outlined text-3xl">add</span></button>
            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'settings' ? 'text-primary' : 'text-neutral-dark'}`}>
              <div className={`flex h-8 w-12 items-center justify-center rounded-full ${view === 'settings' ? 'bg-primary/10' : ''}`}><span className="material-symbols-outlined">settings</span></div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Settings</p>
            </button>
          </div>
        </nav>
      </div>
    );
  };

  return (
    <div className="flex justify-center bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark min-h-screen relative border-x border-slate-200 dark:border-slate-800">
        {view === 'timeline' && renderTimeline()}
        {view === 'edit' && (
          <TaskForm task={selectedTask} onSave={handleSaveTask} onBack={() => setView('timeline')} onDelete={handleDeleteTask} allTasks={tasks} selectedDate={selectedDate} onEditTask={handleEditTask} onGoToDate={handleGoToDate} />
        )}
        {view === 'settings' && (
          <div className="p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <button onClick={() => setView('timeline')} className="mt-8 bg-primary text-white px-6 py-2 rounded-xl font-bold">Back to Timeline</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;