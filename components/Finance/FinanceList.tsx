
import React, { useMemo, useState } from 'react';
import { FinanceEntry, FinanceType } from '../../types';

interface FinanceListProps {
  entries: FinanceEntry[];
  onAdd: () => void;
  onSelect: (entry: FinanceEntry) => void;
}

const FinanceList: React.FC<FinanceListProps> = ({ entries, onAdd, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'debt' | 'credit' | 'fixed'>('all');

  const stats = useMemo(() => {
    return entries.reduce((acc, curr) => {
      if (curr.isSettled && curr.type !== 'fixed') return acc;
      if (curr.type === 'debt') acc.debt += curr.amount;
      else if (curr.type === 'credit') acc.credit += curr.amount;
      else if (curr.type === 'fixed') acc.fixed += curr.amount;
      return acc;
    }, { debt: 0, credit: 0, fixed: 0 });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (activeTab === 'all') return true;
      if (activeTab === 'debt') return e.type === 'debt' && !e.isSettled;
      if (activeTab === 'credit') return e.type === 'credit' && !e.isSettled;
      return e.type === activeTab;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, activeTab]);

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-background-light dark:bg-background-dark">
      <header className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Finance</h1>
          <button onClick={onAdd} className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
            Add Record
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'debt' ? 'all' : 'debt')}
            className={`text-left rounded-[24px] p-4 transition-all active:scale-95 border ${activeTab === 'debt' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
          >
            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${activeTab === 'debt' ? 'text-white/70' : 'text-red-500'}`}>I Owe</p>
            <p className={`text-lg font-bold ${activeTab === 'debt' ? 'text-white' : 'text-red-600 dark:text-red-400'}`}>${stats.debt.toLocaleString()}</p>
          </button>
          
          <button 
            onClick={() => setActiveTab(activeTab === 'credit' ? 'all' : 'credit')}
            className={`text-left rounded-[24px] p-4 transition-all active:scale-95 border ${activeTab === 'credit' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}
          >
            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${activeTab === 'credit' ? 'text-white/70' : 'text-green-500'}`}>Owed Me</p>
            <p className={`text-lg font-bold ${activeTab === 'credit' ? 'text-white' : 'text-green-600 dark:text-green-400'}`}>${stats.credit.toLocaleString()}</p>
          </button>

          <button 
            onClick={() => setActiveTab(activeTab === 'fixed' ? 'all' : 'fixed')}
            className={`text-left rounded-[24px] p-4 transition-all active:scale-95 border ${activeTab === 'fixed' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-primary/10 border-primary/20 text-primary'}`}
          >
            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${activeTab === 'fixed' ? 'text-white/70' : 'opacity-70'}`}>Monthly</p>
            <p className={`text-lg font-bold ${activeTab === 'fixed' ? 'text-white' : ''}`}>${stats.fixed.toLocaleString()}</p>
          </button>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl overflow-x-auto hide-scrollbar">
          {(['all', 'debt', 'credit', 'fixed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-neutral-dark'}`}
            >
              {tab === 'debt' ? 'I Owe' : tab === 'credit' ? 'Owed' : tab}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="py-20 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">account_balance</span>
            <p className="font-medium text-sm">No financial records found</p>
          </div>
        ) : (
          filteredEntries.map((entry, idx) => (
            <button 
              key={entry.id}
              onClick={() => onSelect(entry)}
              className={`w-full flex items-center gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl border transition-all hover:border-primary/20 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 ${entry.isSettled ? 'opacity-50 grayscale' : 'border-slate-100 dark:border-white/5 shadow-sm'}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className={`size-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                entry.type === 'debt' ? 'bg-red-500/10 text-red-500' : 
                entry.type === 'credit' ? 'bg-green-500/10 text-green-500' : 
                'bg-primary/10 text-primary'
              }`}>
                <span className="text-[9px] font-black uppercase leading-none">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-lg font-black leading-none mt-0.5">
                  {new Date(entry.date).getDate()}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-white truncate">
                  {entry.person ? `${entry.person}: ${entry.title}` : entry.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                    entry.type === 'debt' ? 'bg-red-500/10 text-red-500' : 
                    entry.type === 'credit' ? 'bg-green-500/10 text-green-500' : 
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {entry.type === 'debt' ? 'I Need To Pay' : entry.type === 'credit' ? 'Receivable' : 'Fixed Cost'}
                  </span>
                  <p className="text-[10px] font-bold text-neutral-dark truncate">{entry.category}</p>
                </div>
                {entry.note && (
                  <p className="text-[10px] text-neutral-dark/60 truncate mt-1 italic">
                    {entry.note}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">
                  ${entry.amount.toLocaleString()}
                </p>
                <p className="text-[9px] font-bold text-neutral-dark uppercase">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
};

export default FinanceList;
