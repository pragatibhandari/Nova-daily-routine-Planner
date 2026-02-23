
import React, { useState } from 'react';
import { TodoItem } from '../../types';
import DatePicker from '../DatePicker';

interface TodoFormProps {
  item: TodoItem | null;
  onSave: (item: TodoItem) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ item, onSave, onDelete, onBack }) => {
  const [text, setText] = useState(item?.text || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(item?.priority || 'medium');
  const [dueDate, setDueDate] = useState(item?.dueDate || '');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      id: item?.id || Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      priority,
      dueDate: dueDate || undefined,
      completed: item?.completed || false,
      createdAt: item?.createdAt || new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark animate-in slide-in-from-right-10 duration-300">
      <header className="p-4 flex items-center justify-between sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-bold text-lg">Task Details</h2>
        {item ? (
          <button onClick={() => onDelete(item.id)} className="size-10 flex items-center justify-center text-red-500 rounded-full hover:bg-red-500/10">
            <span className="material-symbols-outlined">delete</span>
          </button>
        ) : <div className="size-10" />}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">What needs to be done?</label>
            <textarea 
              placeholder="Enter task description..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl p-5 font-bold outline-none min-h-[120px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Priority</label>
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priority === p ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-neutral-dark'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <DatePicker 
            label="Due Date (Optional)"
            value={dueDate}
            onChange={setDueDate}
          />
        </div>
      </main>

      <footer className="p-6 pb-12 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 sticky bottom-0">
        <button 
          onClick={handleSave}
          className="w-full h-16 bg-primary text-white font-black text-lg rounded-[22px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Save Task
        </button>
      </footer>
    </div>
  );
};

export default TodoForm;
