
import React, { useState } from 'react';
import { FinanceEntry, FinanceType, FinanceCategory } from '../../types';

interface FinanceFormProps {
  entry: FinanceEntry | null;
  currency: string;
  onSave: (entry: FinanceEntry) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const CATEGORIES: FinanceCategory[] = ['Rent', 'Subscription', 'Utility', 'Insurance', 'Loan', 'Person', 'Grocery', 'Other'];

const FinanceForm: React.FC<FinanceFormProps> = ({ entry, currency, onSave, onDelete, onBack }) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [person, setPerson] = useState(entry?.person || '');
  const [amount, setAmount] = useState(entry?.amount?.toString() || '');
  const [type, setType] = useState<FinanceType>(entry?.type || 'debt');
  const [category, setCategory] = useState<FinanceCategory>(entry?.category || 'Person');
  const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
  const [isSettled, setIsSettled] = useState(entry?.isSettled || false);
  const [note, setNote] = useState(entry?.note || '');

  const today = new Date().toISOString().split('T')[0];

  const handleSave = () => {
    const finalTitle = title.trim() || category;
    if (!amount) return;
    if (date > today) return; // Prevent future dates
    onSave({
      id: entry?.id || Math.random().toString(36).substr(2, 9),
      title: finalTitle,
      person: type !== 'fixed' ? person : undefined,
      amount: parseFloat(amount),
      type,
      category,
      date,
      isSettled,
      note: note.trim() || undefined
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark animate-in slide-in-from-right-10 duration-300">
      <header className="p-4 flex items-center justify-between sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-bold text-lg">Record Management</h2>
        {entry ? (
          <button onClick={() => onDelete(entry.id)} className="size-10 flex items-center justify-center text-red-500 rounded-full hover:bg-red-500/10">
            <span className="material-symbols-outlined">delete</span>
          </button>
        ) : <div className="size-10" />}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="flex justify-center">
          <div className="bg-white dark:bg-card-dark rounded-full p-1.5 flex border border-slate-100 dark:border-white/5 shadow-inner">
            {(['debt', 'credit', 'fixed'] as FinanceType[]).map(t => (
              <button 
                key={t}
                onClick={() => {
                  setType(t);
                  if (t === 'fixed' && category === 'Person') setCategory('Subscription');
                  if (t !== 'fixed' && category !== 'Person') setCategory('Person');
                }}
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}
              >
                {t === 'debt' ? 'I Owe' : t === 'credit' ? 'Owed Me' : 'Fixed Cost'}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-bold opacity-20">{currency}</span>
            <input 
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none text-6xl font-black text-center focus:ring-0 w-full p-0 tracking-tighter placeholder:text-slate-200 dark:placeholder:text-white/5"
            />
          </div>
        </div>

        <div className="space-y-6">
          {type !== 'fixed' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Person / Entity</label>
              <input 
                type="text"
                placeholder="Who is this with?"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-5 font-bold outline-none"
              />
            </div>
          )}

          {type === 'fixed' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Purpose / Title</label>
              <input 
                type="text"
                placeholder="e.g. Netflix, Rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-5 font-bold outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    if (!title.trim()) setTitle(cat);
                  }}
                  className={`px-4 py-2 rounded-xl border text-[10px] font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-primary border-primary text-white' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-card-dark text-slate-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Transaction Date</label>
              <input 
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-4 font-bold outline-none text-sm"
              />
            </div>
            {type !== 'fixed' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Status</label>
                <button 
                  onClick={() => setIsSettled(!isSettled)}
                  className={`w-full h-14 rounded-2xl border font-bold text-xs transition-all ${isSettled ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-100 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500'}`}
                >
                  {isSettled ? 'Settled / Paid' : 'Pending'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Additional Note</label>
            <textarea 
              placeholder="Add any extra details here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl p-5 font-medium outline-none text-sm min-h-[100px] resize-none"
            />
          </div>
        </div>
      </main>

      <footer className="p-6 pb-12 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 sticky bottom-0">
        <button 
          onClick={handleSave}
          className="w-full h-16 bg-primary text-white font-black text-lg rounded-[22px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Confirm Ledger Entry
        </button>
      </footer>
    </div>
  );
};

export default FinanceForm;
