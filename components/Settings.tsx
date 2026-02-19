
import React from 'react';
import { AppMode } from '../types';

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  globalAlarmsEnabled: boolean;
  setGlobalAlarmsEnabled: (val: boolean) => void;
  appMode: AppMode;
  onToggleMode: () => void;
  onBack: () => void;
  onResetData: () => void;
  fetchInsight: () => void;
  insight: string | null;
  isOptimizing: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  isDarkMode, setIsDarkMode, globalAlarmsEnabled, setGlobalAlarmsEnabled,
  appMode, onToggleMode, onBack, onResetData, fetchInsight, insight, isOptimizing
}) => {
  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background-light dark:bg-background-dark px-6 pt-10 animate-in fade-in duration-300">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-800 dark:text-white">Settings</h1>
          <p className="text-neutral-dark text-sm">Personalize your Nova experience</p>
        </div>
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <section className="space-y-6">
        {/* Mode Switcher */}
        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{appMode === 'routines' ? 'schedule' : 'description'}</span>
              <h3 className="font-bold text-slate-800 dark:text-white">Current Mode: <span className="text-primary capitalize">{appMode}</span></h3>
            </div>
            <button 
              onClick={onToggleMode}
              className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Switch to {appMode === 'routines' ? 'Notes' : 'Routines'}
            </button>
          </div>
          <p className="text-[10px] text-neutral-dark uppercase font-bold tracking-widest leading-relaxed">
            Changing this will set the default view when you reopen the app.
          </p>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-3xl p-4 border border-slate-100 dark:border-white/5 space-y-1 shadow-sm">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              <span className="font-bold text-slate-700 dark:text-white">App Theme</span>
            </div>
            <span className="text-neutral-dark text-sm font-medium">{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>
          
          <div className="w-full flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-500">notifications_active</span>
              <span className="font-bold text-slate-700 dark:text-white">Master Alarms</span>
            </div>
            <button 
              onClick={() => setGlobalAlarmsEnabled(!globalAlarmsEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative ${globalAlarmsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${globalAlarmsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h3 className="font-bold text-primary">AI Schedule Analysis</h3>
            </div>
            <button 
              onClick={fetchInsight}
              disabled={isOptimizing}
              className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isOptimizing ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
          {insight ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">"{insight}"</p>
          ) : (
            <p className="text-xs text-neutral-dark">Get a personalized productivity tip based on your routines.</p>
          )}
        </div>

        <div className="bg-white dark:bg-card-dark rounded-3xl p-4 border border-slate-100 dark:border-white/5 space-y-1 shadow-sm">
          <button onClick={onResetData} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
            <span className="material-symbols-outlined">delete_forever</span>
            <span className="font-bold">Reset All Data</span>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-dark opacity-30">Nova v1.1.0 • Notes Enabled</p>
        </div>
      </section>
    </div>
  );
};

export default Settings;
