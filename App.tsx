
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, Note, FinanceEntry, ShoppingItem, AppMode, ViewState, RepeatOption } from './types';
import { INITIAL_TASKS } from './constants';
import DateHeader from './components/DateHeader';
import TimelineCard from './components/TimelineCard';
import TaskForm from './components/TaskForm';
import AlarmOverlay from './components/AlarmOverlay';
import Settings from './components/Settings';
import NoteList from './components/Notes/NoteList';
import NoteEditor from './components/Notes/NoteEditor';
import TestView from './components/TestView';
import FinanceList from './components/Finance/FinanceList';
import FinanceForm from './components/Finance/FinanceForm';
import ShoppingList from './components/Shopping/ShoppingList';
import ShoppingForm from './components/Shopping/ShoppingForm';
import NavigationHub from './components/NavigationHub';
import { optimizeSchedule } from './geminiService';
import { getLocalDateString, subtractMinutes } from './components/utils/time';
import { analyzeTimeline } from './components/utils/timeline';
import { filterTasksByDate, getActiveTaskId } from './components/utils/taskUtils';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    return (localStorage.getItem('nova_app_mode') as AppMode) || 'routines';
  });
  const [view, setView] = useState<ViewState>('timeline');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nova_tasks');
    if (saved) return JSON.parse(saved);
    const todayStr = getLocalDateString(new Date());
    return INITIAL_TASKS.map(t => ({ ...t, createdAt: todayStr, subtasks: [] }));
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('nova_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [finances, setFinances] = useState<FinanceEntry[]>(() => {
    const saved = localStorage.getItem('nova_finances');
    return saved ? JSON.parse(saved) : [];
  });
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('nova_shopping');
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
  const [selectedFinance, setSelectedFinance] = useState<FinanceEntry | null>(null);
  const [selectedShoppingItem, setSelectedShoppingItem] = useState<ShoppingItem | null>(null);
  const [prefillTimes, setPrefillTimes] = useState<{start: string, end: string} | null>(null);
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('nova_currency') || '$';
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRungRef = useRef<string | null>(null);

  useEffect(() => { localStorage.setItem('nova_app_mode', appMode); }, [appMode]);
  useEffect(() => { localStorage.setItem('nova_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('nova_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('nova_finances', JSON.stringify(finances)); }, [finances]);
  useEffect(() => { localStorage.setItem('nova_shopping', JSON.stringify(shoppingItems)); }, [shoppingItems]);
  useEffect(() => { localStorage.setItem('nova_currency', currency); }, [currency]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

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

  const filteredTasks = useMemo(() => filterTasksByDate(tasks, selectedDate), [tasks, selectedDate]);
  const activeTaskId = useMemo(() => getActiveTaskId(filteredTasks, now, selectedDate), [filteredTasks, now, selectedDate]);

  const handleSwitchMode = (mode: AppMode) => {
    setAppMode(mode);
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

  const handleSaveFinance = (entry: FinanceEntry) => {
    setFinances(prev => {
      const exists = prev.find(e => e.id === entry.id);
      if (exists) return prev.map(e => e.id === entry.id ? entry : e);
      return [entry, ...prev];
    });
    setSelectedFinance(null);
    setView('timeline');
  };

  const handleDeleteFinance = (id: string) => {
    setFinances(prev => prev.filter(e => e.id !== id));
    setSelectedFinance(null);
    setView('timeline');
  };

  const handleSaveShoppingItem = (item: ShoppingItem) => {
    setShoppingItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? item : i);
      return [item, ...prev];
    });
    setSelectedShoppingItem(null);
    setView('timeline');
  };

  const handleDeleteShoppingItem = (id: string) => {
    setShoppingItems(prev => prev.filter(i => i.id !== id));
    setSelectedShoppingItem(null);
    setView('timeline');
  };

  const handleToggleShoppingItem = (id: string) => {
    setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
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
    setPrefillTimes(null);
    setView('timeline');
  };

  const timelineItems = useMemo(() => analyzeTimeline(filteredTasks), [filteredTasks]);

  const renderRoutines = () => (
    <div className="flex flex-col min-h-screen pb-40 animate-in fade-in duration-300">
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
          timelineItems.map((item, idx) => {
            if (item.type === 'task') {
              return (
                <TimelineCard 
                  key={item.data.id}
                  task={item.data} 
                  isOngoing={item.data.id === activeTaskId}
                  onToggleAlarm={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, alarmEnabled: !t.alarmEnabled } : t))}
                  onToggleSubtask={(taskId, subId) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) } : t))}
                  onClick={(t) => { setSelectedTask(t); setView('edit'); }}
                  onDismissAlarm={handleDismissAlarm}
                  onSnoozeAlarm={handleDismissAlarm}
                />
              );
            } else if (item.type === 'gap') {
              return (
                <div key={`gap-${idx}`} className="ml-5 py-2 group">
                  <div className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 transition-all hover:bg-primary/5 hover:border-primary/30">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-neutral-dark opacity-60 tracking-widest">
                        {item.start} — {item.end}
                      </p>
                      <p className="text-xs font-bold text-slate-400 dark:text-white/20">
                        {item.duration >= 60 ? `${Math.floor(item.duration / 60)}h ${item.duration % 60}m` : `${item.duration}m`} Free Time
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setPrefillTimes({ start: item.start, end: item.end });
                        setSelectedTask(null);
                        setView('edit');
                      }}
                      className="size-8 bg-white dark:bg-white/10 text-primary rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </main>
    </div>
  );

  return (
    <div className="flex justify-center bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark min-h-screen relative border-x border-slate-100 dark:border-slate-800 shadow-sm overflow-x-hidden">
        {view === 'timeline' && (
          <>
            {appMode === 'routines' && renderRoutines()}
            {appMode === 'notes' && <NoteList notes={notes} onSelectNote={(n) => { setSelectedNote(n); setView('note-editor'); }} onAddNote={() => { setSelectedNote(null); setView('note-editor'); }} />}
            {appMode === 'finance' && <FinanceList entries={finances} currency={currency} onCurrencyChange={setCurrency} onAdd={() => { setSelectedFinance(null); setView('finance-editor'); }} onSelect={(e) => { setSelectedFinance(e); setView('finance-editor'); }} />}
            {appMode === 'shopping' && <ShoppingList items={shoppingItems} currency={currency} onToggle={handleToggleShoppingItem} onSelect={(i) => { setSelectedShoppingItem(i); setView('shopping-editor'); }} onAdd={() => { setSelectedShoppingItem(null); setView('shopping-editor'); }} />}
          </>
        )}
        
        {view === 'settings' && <Settings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} globalAlarmsEnabled={globalAlarmsEnabled} setGlobalAlarmsEnabled={setGlobalAlarmsEnabled} appMode={appMode} onToggleMode={handleSwitchMode} onBack={() => setView('timeline')} onResetData={() => { if(confirm("Reset all data?")) { localStorage.clear(); window.location.reload(); } }} fetchInsight={async () => { setIsOptimizing(true); const res = await optimizeSchedule(JSON.stringify(tasks)); setProductivityInsight(res); setIsOptimizing(false); }} insight={productivityInsight} isOptimizing={isOptimizing} onGoToTests={() => setView('tests')} />}
        {view === 'edit' && <TaskForm task={selectedTask} prefillStart={prefillTimes?.start} prefillEnd={prefillTimes?.end} onSave={handleSaveTask} onBack={() => { setSelectedTask(null); setPrefillTimes(null); setView('timeline'); }} onDelete={(id) => { setTasks(prev => prev.filter(t => t.id !== id)); setView('timeline'); }} allTasks={tasks} selectedDate={selectedDate} />}
        {view === 'note-editor' && <NoteEditor note={selectedNote} onSave={handleSaveNote} onBack={() => { setSelectedNote(null); setView('timeline'); }} onDelete={handleDeleteNote} />}
        {view === 'finance-editor' && <FinanceForm entry={selectedFinance} currency={currency} onSave={handleSaveFinance} onDelete={handleDeleteFinance} onBack={() => { setSelectedFinance(null); setView('timeline'); }} />}
        {view === 'shopping-editor' && <ShoppingForm item={selectedShoppingItem} currency={currency} onSave={handleSaveShoppingItem} onDelete={handleDeleteShoppingItem} onBack={() => { setSelectedShoppingItem(null); setView('timeline'); }} />}
        {view === 'tests' && <TestView onBack={() => setView('settings')} />}
        
        {view === 'timeline' && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-100 dark:border-white/5 pb-8 pt-4 shadow-2xl">
            <div className="flex justify-between items-center px-6">
              <NavigationHub currentMode={appMode} onSwitchMode={handleSwitchMode} />
              
              <button 
                onClick={() => { 
                  if (appMode === 'routines') { setPrefillTimes(null); setSelectedTask(null); setView('edit'); } 
                  else if (appMode === 'notes') { setSelectedNote(null); setView('note-editor'); }
                  else if (appMode === 'finance') { setSelectedFinance(null); setView('finance-editor'); }
                  else { setSelectedShoppingItem(null); setView('shopping-editor'); }
                }} 
                className="size-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center -mt-8 border-4 border-white dark:border-background-dark active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-3xl">add</span>
              </button>
              
              <button onClick={() => setView('settings')} className="flex flex-col items-center gap-1 flex-1 text-neutral-dark">
                <div className="flex h-8 w-12 items-center justify-center rounded-full">
                  <span className="material-symbols-outlined">settings</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-tighter">System</p>
              </button>
            </div>
          </nav>
        )}
        {ringingTaskId && <AlarmOverlay task={tasks.find(t => t.id === ringingTaskId)!} onDismiss={handleDismissAlarm} onSnooze={handleDismissAlarm} />}
      </div>
    </div>
  );
};

export default App;
