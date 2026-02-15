
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, ViewState, RepeatOption, Subtask } from './types';
import { INITIAL_TASKS } from './constants';
import DateHeader from './components/DateHeader';
import TimelineCard from './components/TimelineCard';
import TaskForm from './components/TaskForm';
import AlarmOverlay from './components/AlarmOverlay';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('timeline');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nova_tasks');
    if (saved) return JSON.parse(saved);
    const todayStr = new Date().toISOString().split('T')[0];
    return INITIAL_TASKS.map(t => ({ ...t, createdAt: todayStr, subtasks: [] }));
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Alarm State
  const [ringingTask, setRingingTask] = useState<Task | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRungRef = useRef<string | null>(null); // Format: "taskId_HH:mm"

  useEffect(() => {
    localStorage.setItem('nova_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Audio setup
  useEffect(() => {
    // Using a reliable high-quality notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
  }, []);

  // Time Monitoring for Alarm
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      // Only check alarms if we are looking at today (or if we want alarms to fire regardless of UI view)
      const tasksToAlarm = tasks.filter(t => {
        if (!t.alarmEnabled || t.startTime !== currentHHmm) return false;
        
        // Simple logic to check if this task belongs to "today"
        const taskDate = new Date(t.createdAt);
        if (t.repeat === RepeatOption.DAILY) return true;
        if (t.repeat === RepeatOption.WEEKLY && taskDate.getDay() === now.getDay()) return true;
        if (t.repeat === RepeatOption.MONTHLY && taskDate.getDate() === now.getDate()) return true;
        if (t.createdAt === todayStr) return true;
        
        return false;
      });

      if (tasksToAlarm.length > 0) {
        const taskToRing = tasksToAlarm[0];
        const rungId = `${taskToRing.id}_${currentHHmm}`;
        
        if (lastRungRef.current !== rungId) {
          lastRungRef.current = rungId;
          setRingingTask(taskToRing);
          audioRef.current?.play().catch(e => console.warn("Audio play blocked: user interaction required", e));
        }
      }
    };

    const interval = setInterval(checkAlarms, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [tasks]);

  const handleDismissAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingTask(null);
  };

  const filteredTasks = useMemo(() => {
    const targetDate = new Date(selectedDate);
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      
      if (task.repeat === RepeatOption.DAILY) return true;
      
      if (task.repeat === RepeatOption.WEEKLY) {
        return taskDate.getDay() === targetDate.getDay();
      }
      
      if (task.repeat === RepeatOption.MONTHLY) {
        return taskDate.getDate() === targetDate.getDate();
      }
      
      return task.createdAt === selectedDate;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, selectedDate]);

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
      if (exists) {
        return prev.map(t => t.id === task.id ? task : t);
      }
      // If adding new, respect the date we are currently viewing
      return [...prev, { ...task, createdAt: selectedDate }];
    });
    setView('timeline');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setView('timeline');
  };

  const renderTimeline = () => (
    <div className="flex flex-col min-h-screen pb-32 bg-background-light dark:bg-background-dark">
      <DateHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      
      <main className="flex-1 px-6 py-4 space-y-4">
        <h2 className="text-lg font-bold text-neutral-dark mb-2 uppercase tracking-widest text-[10px]">
          {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Schedule" : `Schedule for ${selectedDate}`}
        </h2>
        
        {filteredTasks.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-50">
            <span className="material-symbols-outlined text-6xl">event_busy</span>
            <p className="font-medium">No routine tasks for this day</p>
            <button 
              onClick={handleAddNewTask}
              className="text-primary font-bold text-sm underline"
            >
              Add a task
            </button>
          </div>
        ) : filteredTasks.map((task, index) => {
          const nextTask = filteredTasks[index + 1];
          
          const [curH, curM] = task.endTime.split(':').map(Number);
          const currentEndTotal = curH * 60 + curM;

          let nextStartMinutes: number | null = null;
          if (nextTask) {
            const [nH, nM] = nextTask.startTime.split(':').map(Number);
            nextStartMinutes = nH * 60 + nM;
          }

          const hasGap = nextTask && nextStartMinutes !== null && (nextStartMinutes - currentEndTotal >= 30);
          const hasOverlap = nextTask && nextStartMinutes !== null && (nextStartMinutes < currentEndTotal);

          return (
            <React.Fragment key={task.id}>
              <TimelineCard 
                task={task} 
                onToggleAlarm={handleToggleAlarm}
                onToggleSubtask={handleToggleSubtask}
                onClick={handleEditTask}
              />
              
              {hasOverlap && (
                 <div 
                  onClick={() => handleEditTask(nextTask)}
                  className="ml-4 flex items-center justify-between py-2 px-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl animate-in zoom-in-95 duration-300 cursor-pointer opacity-80 hover:opacity-100 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-red-400/80">warning</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/80">
                      You have overlapping schedule
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-sm text-red-400/80">add</span>
                </div>
              )}

              {hasGap && !hasOverlap && (
                <div 
                  onClick={handleAddNewTask}
                  className="ml-4 flex items-center justify-between py-2 px-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl opacity-60 hover:opacity-100 transition-opacity cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">history_toggle_off</span>
                    <p className="text-[10px] font-medium uppercase tracking-wider">
                      {task.endTime} - {nextTask.startTime} • Free Time
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {filteredTasks.length > 0 && (
          <div className="pt-8 flex flex-col items-center justify-center opacity-40">
            <div className="w-16 h-1 bg-slate-200 dark:bg-white/5 rounded-full mb-8"></div>
            <span className="material-symbols-outlined text-4xl mb-2">bedtime</span>
            <p className="text-sm font-medium">Rest of day looks clear</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-8 pt-4">
        <div className="max-w-md mx-auto flex justify-between items-center px-6">
          <div className="flex flex-1 justify-center">
            <button 
              onClick={() => setView('timeline')}
              className={`flex flex-col items-center gap-1 group ${view === 'timeline' ? 'text-primary' : 'text-neutral-dark'}`}
            >
              <div className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${view === 'timeline' ? 'bg-primary/10' : 'group-hover:bg-primary/5'}`}>
                <span className={`material-symbols-outlined ${view === 'timeline' ? 'fill-1' : ''}`}>schedule</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Timeline</p>
            </button>
          </div>
          
          <div className="flex flex-1 justify-center -mt-8">
            <button 
              onClick={handleAddNewTask}
              className="size-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform border-4 border-white dark:border-background-dark"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
          
          <div className="flex flex-1 justify-center">
            <button 
              onClick={() => setView('settings')}
              className={`flex flex-col items-center gap-1 group ${view === 'settings' ? 'text-primary' : 'text-neutral-dark'}`}
            >
              <div className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${view === 'settings' ? 'bg-primary/10' : 'group-hover:bg-primary/5'}`}>
                <span className={`material-symbols-outlined ${view === 'settings' ? 'fill-1' : ''}`}>settings</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tighter">Settings</p>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="flex justify-center bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark min-h-screen relative border-x border-slate-200 dark:border-slate-800">
        {view === 'timeline' && renderTimeline()}
        {view === 'edit' && (
          <TaskForm 
            task={selectedTask} 
            onSave={handleSaveTask} 
            onBack={() => setView('timeline')}
            onDelete={handleDeleteTask}
            allTasks={tasks}
            selectedDate={selectedDate}
          />
        )}
        {view === 'settings' && (
          <div className="p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-neutral-dark">Personalize your routine experience here.</p>
            <button 
              onClick={() => setView('timeline')}
              className="mt-8 bg-primary text-white px-6 py-2 rounded-xl font-bold active:scale-95"
            >
              Back to Timeline
            </button>
          </div>
        )}
        
        {/* Alarm Overlay */}
        {ringingTask && (
          <AlarmOverlay task={ringingTask} onDismiss={handleDismissAlarm} />
        )}
      </div>
    </div>
  );
};

export default App;
