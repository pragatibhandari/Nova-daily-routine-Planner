
import React, { useState } from 'react';
import { AppMode } from '../types';

interface NavigationHubProps {
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
}

const NavigationHub: React.FC<NavigationHubProps> = ({ currentMode, onSwitchMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modes: { id: AppMode, label: string, icon: string, color: string }[] = [
    { id: 'routines', label: 'Routines', icon: 'schedule', color: 'bg-primary' },
    { id: 'notes', label: 'Notes', icon: 'description', color: 'bg-indigo-500' },
    { id: 'finance', label: 'Finance', icon: 'account_balance_wallet', color: 'bg-emerald-500' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_cart', color: 'bg-orange-500' }
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex flex-col items-center gap-1 flex-1 text-primary transition-all active:scale-95"
      >
        <div className="flex h-8 w-12 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined">
            {currentMode === 'routines' ? 'schedule' : currentMode === 'notes' ? 'description' : currentMode === 'finance' ? 'account_balance_wallet' : 'shopping_cart'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`material-symbols-outlined text-[14px] font-bold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            keyboard_double_arrow_up
          </span>
          <p className="text-[10px] font-black uppercase tracking-tighter">{currentMode}</p>
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white/80 dark:bg-background-dark/80 backdrop-blur-2xl p-2 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col gap-1 w-48">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-dark text-center py-2 opacity-60">Switch Workspace</p>
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                onSwitchMode(mode.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${currentMode === mode.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300'}`}
            >
              <div className={`size-8 rounded-lg flex items-center justify-center ${currentMode === mode.id ? mode.color + ' text-white' : 'bg-slate-100 dark:bg-white/5'}`}>
                <span className="material-symbols-outlined text-lg">{mode.icon}</span>
              </div>
              <span className="font-bold text-sm">{mode.label}</span>
              {currentMode === mode.id && <span className="material-symbols-outlined text-sm ml-auto">check</span>}
            </button>
          ))}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NavigationHub;
