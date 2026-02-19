
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, Note, AppMode, ViewState, RepeatOption } from './types';
import { INITIAL_TASKS } from './constants';
import DateHeader from './components/DateHeader';
import TimelineCard from './components/TimelineCard';
import TaskForm from './components/TaskForm';
import AlarmOverlay from './components/AlarmOverlay';
import Settings from './components/Settings';
import NoteList from './components/Notes/NoteList';
import NoteEditor from './components/Notes/NoteEditor';
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
  // --- Persistent Mode Logic ---
  const [appMode, setAppMode] = useState<AppMode>(() => {
    return (localStorage.getItem('nova_app_mode') as AppMode) || 'routines';
  });

  const [view, setView] = useState<ViewState>('timeline');

  // --- Routine Data ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nova_tasks');
    if (saved) return JSON.parse(saved);
    const todayStr = getLocalDateString(new Date());
    return INITIAL_TASKS.map(t => ({ ...t, createdAt: todayStr, subtasks: [] }));
  });

  // --- Notes Data ---
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('nova_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString(new Date()));
  const [now, setNow] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [globalAlarmsEnabled, setGlobalAlarmsEnabled] = useState(true);
  const [productivityInsight, setProductivityInsight] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [ringingTaskId, setRingingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRungRef = useRef<string | null>(null);

  // Sync mode to local storage
  useEffect(() => {
    localStorage.setItem('nova_app_mode', appMode);
  }, [appMode]);

  // Sync tasks to local storage
  useEffect(() => {
    localStorage.setItem('nova_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync notes to local storage
  useEffect(() => {
    localStorage.setItem('nova_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
  }, []);

  // --- Alarms Logic ---
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

        if (isToday && triggerTime === currentHHmm) {
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
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setRingingTaskId(null);
  };

  const filteredTasks = useMemo(() => {
    const targetDate = new Date(selectedDate);
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      if (task.repeat === RepeatOption.DAILY) return true;
      if (task.repeat === RepeatOption.WEEKLY) return taskDate.getDay() === targetDate.getDay();
      if (task.repeat === RepeatOption.MONTHLY) return taskDate.getDate() === targetDate.getDate();
      return task.createdAt === selectedDate;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
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
      return currentMins >= startMins && currentMins < endMins;
    })?.id || null;
  }, [filteredTasks, selectedDate, now]);

  // --- Handlers ---
  const handleToggleMode = () => {
    const nextMode = appMode === 'routines' ? 'notes' : 'routines';
    setAppMode(nextMode);
    setView('timeline');
  };

  const handleSaveNote = (note: Note) => {
    setNotes(prev => {
      const exists = prev.find(n => n.id === note.id);
      if (exists) return prev.map(n => n.id === note.id ? note : n);
      return [note, ...prev];
    });
    setSelectedNote(null);
    setView('timeline');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedNote(null);
    setView('timeline');
  };

  const handleSaveTask = (task: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, { ...task, createdAt: selectedDate }];
    });
    setSelectedTask(null);
    setView('timeline');
  };

  // --- Rendering Functions ---
  const renderRoutines = () => (
    <div className="flex flex-col min-h-screen pb-32">
      <DateHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} tasks={tasks} />
      <main className="flex-1 px-6 py-4 space-y-4">
        <h2 className="text-[10px] font-bold text-neutral-dark uppercase tracking-widest">
          {selectedDate === getLocalDateString(now) ? "Today's Schedule" : `Schedule for ${selectedDate}`}
        </h2>
        {filteredTasks.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-40">
            <span className="material-symbols-outlined text-6xl">event_busy</span>
            <p className="font-medium">No routines found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TimelineCard 
              key={task.id}
              task={task} 
              isOngoing={task.id === activeTaskId}
              onToggleAlarm={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, alarmEnabled: !t.alarmEnabled } : t))}
              onToggleSubtask={(taskId, subId) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) } : t))}
              onClick={(t) => { setSelectedTask(t); setView('edit'); }}
              onDismissAlarm={handleDismissAlarm}
              onSnoozeAlarm={handleDismissAlarm}
            />
          ))
        )}
        
        {filteredTasks.length > 0 && (() => {
          const lastTask = filteredTasks[filteredTasks.length - 1];
          const [h, m] = lastTask.endTime.split(':').map(Number);
          const lastTotalMins = h * 60 + m;
          let greeting = "Good night, sleep tight";
          let icon = "bedtime";
          if (lastTotalMins < 20 * 60) { greeting = "rest of the day is clear."; icon = "wb_twilight"; }
          else if (lastTotalMins < 22 * 60) { greeting = "Hope you wind down and sleep well"; icon = "nights_stay"; }
          
          return (
            <div className="mt-8 mb-4 py-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <span className="material-symbols-outlined text-primary/40 text-2xl mb-2">{icon}</span>
              <h3 className="text-xl font-bold text-slate-400 dark:text-white/20">{greeting}</h3>
            </div>
          );
        })()}
      </main>
    </div>
  );

  const renderNotes = () => (
    <NoteList 
      notes={notes} 
      onSelectNote={(note) => { setSelectedNote(note); setView('note-editor'); }} 
      onAddNote={() => { setSelectedNote(null); setView('note-editor'); }}
    />
  );

  return (
    <div className="flex justify-center bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark min-h-screen relative border-x border-slate-100 dark:border-slate-800 shadow-sm overflow-x-hidden">
        
        {view === 'timeline' && (appMode === 'routines' ? renderRoutines() : renderNotes())}
        
        {view === 'settings' && (
          <Settings 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            globalAlarmsEnabled={globalAlarmsEnabled}
            setGlobalAlarmsEnabled={setGlobalAlarmsEnabled}
            appMode={appMode}
            onToggleMode={handleToggleMode}
            onBack={() => setView('timeline')}
            onResetData={() => { if(confirm("Reset all?")) { setTasks([]); setNotes([]); localStorage.clear(); window.location.reload(); } }}
            fetchInsight={async () => {
              setIsOptimizing(true);
              const res = await optimizeSchedule(JSON.stringify(tasks));
              setProductivityInsight(res);
              setIsOptimizing(false);
            }}
            insight={productivityInsight}
            isOptimizing={isOptimizing}
          />
        )}

        {view === 'edit' && (
          <TaskForm 
            task={selectedTask} 
            onSave={handleSaveTask} 
            onBack={() => { setSelectedTask(null); setView('timeline'); }} 
            onDelete={(id) => { setTasks(prev => prev.filter(t => t.id !== id)); setView('timeline'); }} 
            allTasks={tasks} 
            selectedDate={selectedDate}
          />
        )}

        {view === 'note-editor' && (
          <NoteEditor 
            note={selectedNote} 
            onSave={handleSaveNote} 
            onBack={() => { setSelectedNote(null); setView('timeline'); }} 
            onDelete={handleDeleteNote}
          />
        )}
        
        {view === 'timeline' && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-100 dark:border-white/5 pb-8 pt-4 shadow-2xl">
            <div className="flex justify-between items-center px-6">
              <button onClick={() => setView('timeline')} className="flex flex-col items-center gap-1 flex-1 text-primary">
                <div className="flex h-8 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="material-symbols-outlined">{appMode === 'routines' ? 'schedule' : 'description'}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-tighter">{appMode === 'routines' ? 'Timeline' : 'Notes'}</p>
              </button>
              <button 
                onClick={() => {
                  if (appMode === 'routines') { setSelectedTask(null); setView('edit'); }
                  else { setSelectedNote(null); setView('note-editor'); }
                }} 
                className="size-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center -mt-8 border-4 border-white dark:border-background-dark active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-3xl">add</span>
              </button>
              <button onClick={() => setView('settings')} className="flex flex-col items-center gap-1 flex-1 text-neutral-dark">
                <div className="flex h-8 w-12 items-center justify-center rounded-full"><span className="material-symbols-outlined">settings</span></div>
                <p className="text-[10px] font-bold uppercase tracking-tighter">Settings</p>
              </button>
            </div>
          </nav>
        )}

        {ringingTaskId && (
          <AlarmOverlay 
            task={tasks.find(t => t.id === ringingTaskId)!} 
            onDismiss={handleDismissAlarm} 
            onSnooze={handleDismissAlarm} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
