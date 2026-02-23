
import React, { useState } from 'react';
import { Goal, GoalCategory } from '../../types';
import DatePicker from '../DatePicker';

interface GoalFormProps {
  goal: Goal | null;
  onSave: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ goal, onSave, onDelete, onBack }) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [category, setCategory] = useState<GoalCategory>(goal?.category || 'short-term');
  const [targetDate, setTargetDate] = useState(goal?.targetDate || '');

  const handleSave = () => {
    if (!title || !targetDate) return;
    onSave({
      id: goal?.id || Math.random().toString(36).substr(2, 9),
      title,
      description,
      category,
      targetDate,
      completed: goal?.completed || false,
      createdAt: goal?.createdAt || new Date().toISOString().split('T')[0]
    });
  };

  const handleCategoryChange = (cat: GoalCategory) => {
    setCategory(cat);
    if (cat === 'year') {
      const currentYear = new Date().getFullYear();
      setTargetDate(`${currentYear}-12-31`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-in slide-in-from-right duration-300">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl z-20">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{goal ? 'Edit Goal' : 'New Goal'}</h2>
        <button 
          onClick={handleSave}
          disabled={!title || !targetDate}
          className="bg-primary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
          Save
        </button>
      </header>

      <main className="px-6 py-8 space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Goal Title</label>
          <input 
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to achieve?"
            className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-3xl px-6 py-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20 transition-all text-slate-800 dark:text-white"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {(['short-term', 'long-term', 'year'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${category === cat ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-card-dark border-slate-100 dark:border-white/5 text-neutral-dark'}`}
              >
                {cat.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <DatePicker 
          label="Target Date"
          value={targetDate}
          onChange={setTargetDate}
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Notes (Optional)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some details about your goal..."
            rows={4}
            className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-3xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 ring-primary/20 transition-all text-slate-800 dark:text-white resize-none"
          />
        </div>

        {goal && (
          <button 
            onClick={() => { if(confirm('Delete this goal?')) onDelete(goal.id); }}
            className="w-full py-4 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-3xl transition-all"
          >
            <span className="material-symbols-outlined">delete</span>
            Delete Goal
          </button>
        )}
      </main>
    </div>
  );
};

export default GoalForm;
