
import React, { useState } from 'react';
import { AppMode, FocusMusicLink, PomodoroGlobalConfig } from '../types';
import Toggle from './Toggle';

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  globalAlarmsEnabled: boolean;
  setGlobalAlarmsEnabled: (val: boolean) => void;
  appMode: AppMode;
  onToggleMode: (mode: AppMode) => void;
  onBack: () => void;
  onResetData: () => void;
  fetchInsight: () => void;
  insight: string | null;
  isOptimizing: boolean;
  onGoToTests?: () => void;
  focusMusicLinks: FocusMusicLink[];
  onAddMusicLink: (title: string, url: string) => void;
  onDeleteMusicLink: (id: string) => void;
  pomodoroConfig: PomodoroGlobalConfig;
  onUpdatePomodoroConfig: (config: PomodoroGlobalConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({
  isDarkMode, setIsDarkMode, globalAlarmsEnabled, setGlobalAlarmsEnabled,
  appMode, onToggleMode, onBack, onResetData, fetchInsight, insight, isOptimizing,
  onGoToTests, focusMusicLinks, onAddMusicLink, onDeleteMusicLink,
  pomodoroConfig, onUpdatePomodoroConfig
}) => {
  const [newMusicTitle, setNewMusicTitle] = useState('');
  const [newMusicUrl, setNewMusicUrl] = useState('');
  const [showMusicAdd, setShowMusicAdd] = useState(false);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const workspaces: { id: AppMode, label: string, icon: string, desc: string, color: string }[] = [
    { id: 'routines', label: 'Routines', icon: 'schedule', desc: 'Daily schedule & habits', color: 'primary' },
    { id: 'notes', label: 'Notes', icon: 'description', desc: 'Ideas & documentation', color: 'indigo-500' },
    { id: 'finance', label: 'Finance', icon: 'account_balance_wallet', desc: 'Ledger & management', color: 'emerald-500' },
    { id: 'pomodoro', label: 'Pomodoro', icon: 'timer', desc: 'Focus & break intervals', color: 'rose-500' }
  ];

  const handleAddMusic = () => {
    if (!newMusicTitle || !newMusicUrl) return;
    onAddMusicLink(newMusicTitle, newMusicUrl);
    setNewMusicTitle('');
    setNewMusicUrl('');
    setShowMusicAdd(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-background-light dark:bg-background-dark px-6 pt-10 animate-in fade-in duration-300">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-800 dark:text-white">Settings</h1>
          <p className="text-neutral-dark text-sm font-medium">Customize your Nova workspace</p>
        </div>
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <section className="space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-dark pl-1">Workspaces</label>
          <div className="grid grid-cols-1 gap-3">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => onToggleMode(ws.id)}
                className={`p-5 rounded-3xl border transition-all flex items-center gap-4 relative overflow-hidden group ${appMode === ws.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-card-dark'}`}
              >
                <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${appMode === ws.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-100 dark:bg-white/5 text-neutral-dark'}`}>
                  <span className="material-symbols-outlined">{ws.icon}</span>
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white">{ws.label}</h4>
                  <p className="text-xs text-neutral-dark font-medium">{ws.desc}</p>
                </div>
                {appMode === ws.id ? (
                  <div className="bg-primary text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Active</div>
                ) : (
                  <span className="material-symbols-outlined text-neutral-dark/30 group-hover:translate-x-1 transition-transform">chevron_right</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-dark pl-1">System Preference</label>
          <div className="bg-white dark:bg-card-dark rounded-[32px] p-4 border border-slate-100 dark:border-white/5 space-y-1 shadow-sm">
            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-white">App Appearance</span>
              </div>
              <span className="text-neutral-dark text-xs font-black uppercase tracking-widest">{isDarkMode ? 'Dark' : 'Light'}</span>
            </button>
            
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-white">Master Alarms</span>
              </div>
              <button 
                onClick={() => setGlobalAlarmsEnabled(!globalAlarmsEnabled)}
                className={`w-14 h-7 rounded-full transition-all relative p-1 ${globalAlarmsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <div className={`h-full aspect-square bg-white rounded-full transition-all shadow-md ${globalAlarmsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-white">Pomodoro Timer</span>
              </div>
              <Toggle 
                checked={pomodoroConfig.enabled} 
                onChange={(val) => onUpdatePomodoroConfig({ ...pomodoroConfig, enabled: val })} 
              />
            </div>

            {pomodoroConfig.enabled && (
              <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-dark px-1">Work (min)</label>
                    <input 
                      type="number" 
                      value={pomodoroConfig.workDuration} 
                      onChange={(e) => onUpdatePomodoroConfig({ ...pomodoroConfig, workDuration: parseInt(e.target.value) || 0 })} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-dark px-1">Short Break (min)</label>
                    <input 
                      type="number" 
                      value={pomodoroConfig.shortBreakDuration} 
                      onChange={(e) => onUpdatePomodoroConfig({ ...pomodoroConfig, shortBreakDuration: parseInt(e.target.value) || 0 })} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-dark px-1">Long Break (min)</label>
                    <input 
                      type="number" 
                      value={pomodoroConfig.longBreakDuration} 
                      onChange={(e) => onUpdatePomodoroConfig({ ...pomodoroConfig, longBreakDuration: parseInt(e.target.value) || 0 })} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-dark px-1">Interval (pomos)</label>
                    <input 
                      type="number" 
                      value={pomodoroConfig.longBreakInterval} 
                      onChange={(e) => onUpdatePomodoroConfig({ ...pomodoroConfig, longBreakInterval: parseInt(e.target.value) || 0 })} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-white/60">Auto-start Pomodoros</span>
                    <Toggle 
                      checked={pomodoroConfig.autoStartPomodoros} 
                      onChange={(val) => onUpdatePomodoroConfig({ ...pomodoroConfig, autoStartPomodoros: val })} 
                    />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-white/60">Auto-start Breaks</span>
                    <Toggle 
                      checked={pomodoroConfig.autoStartBreaks} 
                      onChange={(val) => onUpdatePomodoroConfig({ ...pomodoroConfig, autoStartBreaks: val })} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">music_note</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-white">Pomodoro Music</span>
              </div>
              <Toggle 
                checked={pomodoroConfig.musicEnabled} 
                onChange={(val) => onUpdatePomodoroConfig({ ...pomodoroConfig, musicEnabled: val })} 
              />
            </div>

            {onGoToTests && (
              <button onClick={onGoToTests} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">biotech</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-white">Run Diagnostics</span>
                </div>
                <span className="material-symbols-outlined text-neutral-dark text-sm">chevron_right</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-dark pl-1">Focus Music (YouTube)</label>
          <div className="bg-white dark:bg-card-dark rounded-[32px] p-4 border border-slate-100 dark:border-white/5 space-y-3 shadow-sm">
            {focusMusicLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">play_circle</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{link.title}</p>
                    <p className="text-[9px] text-neutral-dark truncate opacity-60">{link.url}</p>
                  </div>
                </div>
                <button onClick={() => onDeleteMusicLink(link.id)} className="size-8 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}

            {showMusicAdd ? (
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-3 animate-in zoom-in-95 duration-200">
                <input 
                  placeholder="Music Title (e.g. Lofi Focus)" 
                  value={newMusicTitle}
                  onChange={(e) => setNewMusicTitle(e.target.value)}
                  className="w-full bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                />
                <input 
                  placeholder="YouTube URL" 
                  value={newMusicUrl}
                  onChange={(e) => setNewMusicUrl(e.target.value)}
                  className="w-full bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddMusic} className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Add</button>
                  <button onClick={() => setShowMusicAdd(false)} className="flex-1 bg-slate-200 dark:bg-white/10 text-neutral-dark py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowMusicAdd(true)} className="w-full py-3 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-dark hover:border-primary/40 hover:text-primary transition-all">
                + Add Music Link
              </button>
            )}
          </div>
        </div>

        <div className="bg-primary/5 rounded-[32px] p-6 border border-primary/10 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Schedule Insight</h3>
            </div>
            <button 
              onClick={fetchInsight}
              disabled={isOptimizing}
              className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isOptimizing ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
          <div className="relative z-10">
            {insight ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed pl-1">"{insight}"</p>
            ) : (
              <p className="text-[11px] text-neutral-dark font-medium leading-relaxed pl-1">Generate a personalized productivity optimization based on your existing routines.</p>
            )}
          </div>
        </div>

        <button onClick={onResetData} className="w-full flex items-center justify-center gap-3 p-5 text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-[32px] transition-all font-bold">
          <span className="material-symbols-outlined">delete_forever</span>
          <span>Wipe System Data</span>
        </button>

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-dark opacity-30 text-center">Nova Workspace v1.2.0</p>
      </section>
    </div>
  );
};

export default Settings;
