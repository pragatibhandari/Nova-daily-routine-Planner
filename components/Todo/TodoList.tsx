
import React, { useMemo, useState } from 'react';
import { TodoItem, Goal } from '../../types';

interface TodoListProps {
  items: TodoItem[];
  goals: Goal[];
  activeMainTab: 'tasks' | 'goals';
  onMainTabChange: (tab: 'tasks' | 'goals') => void;
  onToggle: (id: string) => void;
  onSelect: (item: TodoItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onToggleGoal: (id: string) => void;
  onSelectGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onAddGoal: () => void;
}

const TodoList: React.FC<TodoListProps> = ({ 
  items, goals, activeMainTab, onMainTabChange, onToggle, onSelect, onDelete, onAdd,
  onToggleGoal, onSelectGoal, onDeleteGoal, onAddGoal
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const stats = useMemo(() => {
    if (activeMainTab === 'tasks') {
      return items.reduce((acc, curr) => {
        if (curr.completed) acc.completed++;
        else acc.pending++;
        return acc;
      }, { pending: 0, completed: 0 });
    } else {
      return goals.reduce((acc, curr) => {
        if (curr.completed) acc.completed++;
        else acc.pending++;
        return acc;
      }, { pending: 0, completed: 0 });
    }
  }, [items, goals, activeMainTab]);

  const filteredItems = useMemo(() => {
    if (activeMainTab === 'tasks') {
      return items
        .filter(item => activeTab === 'completed' ? item.completed : !item.completed)
        .sort((a, b) => {
          const priorityMap = { high: 0, medium: 1, low: 2 };
          if (priorityMap[a.priority] !== priorityMap[b.priority]) {
            return priorityMap[a.priority] - priorityMap[b.priority];
          }
          return b.createdAt.localeCompare(a.createdAt);
        });
    } else {
      return goals
        .filter(goal => activeTab === 'completed' ? goal.completed : !goal.completed)
        .sort((a, b) => b.targetDate.localeCompare(a.targetDate));
    }
  }, [items, goals, activeTab, activeMainTab]);

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-background-light dark:bg-background-dark">
      <header className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">To-Do List</h1>
          {activeMainTab === 'tasks' ? (
            <button 
              onClick={onAdd} 
              className="bg-rose-500 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Task
            </button>
          ) : (
            <button 
              onClick={onAddGoal} 
              className="bg-rose-500 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Goal
            </button>
          )}
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
          {(['tasks', 'goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => onMainTabChange(tab)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMainTab === tab ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-neutral-dark'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-card-dark rounded-[24px] p-4 border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-dark mb-1">Pending</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-card-dark rounded-[24px] p-4 border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-dark mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
          {(['pending', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-neutral-dark'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">
              {activeMainTab === 'tasks' ? 'task_alt' : 'flag'}
            </span>
            <p className="font-medium text-sm">No {activeMainTab} here</p>
          </div>
        ) : activeMainTab === 'tasks' ? (
          (filteredItems as TodoItem[]).map((item, idx) => (
            <div 
              key={item.id}
              className={`flex items-center gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${item.completed ? 'opacity-50 grayscale' : 'border-slate-100 dark:border-white/5 shadow-sm'}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <button 
                onClick={() => onToggle(item.id)}
                className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-primary border-primary text-white' : 'border-slate-200 dark:border-white/10'}`}
              >
                {item.completed && <span className="material-symbols-outlined text-sm font-bold">check</span>}
              </button>
              
              <button 
                onClick={() => onSelect(item)}
                className="flex-1 text-left min-w-0"
              >
                <h4 className="font-bold text-slate-800 dark:text-white truncate">
                  {item.text}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md ${
                    item.priority === 'high' ? 'bg-red-500/10 text-red-500' : 
                    item.priority === 'medium' ? 'bg-orange-500/10 text-orange-500' : 
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {item.priority}
                  </span>
                  {item.dueDate && (
                    <p className="text-[10px] font-bold text-neutral-dark truncate">
                      Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </button>

              {item.completed && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="size-8 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}
            </div>
          ))
        ) : (
          (filteredItems as Goal[]).map((goal, idx) => (
            <div 
              key={goal.id}
              className={`flex items-center gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${goal.completed ? 'opacity-50 grayscale' : 'border-slate-100 dark:border-white/5 shadow-sm'}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <button 
                onClick={() => onToggleGoal(goal.id)}
                className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${goal.completed ? 'bg-primary border-primary text-white' : 'border-slate-200 dark:border-white/10'}`}
              >
                {goal.completed && <span className="material-symbols-outlined text-sm font-bold">check</span>}
              </button>
              
              <button 
                onClick={() => onSelectGoal(goal)}
                className="flex-1 text-left min-w-0"
              >
                <h4 className="font-bold text-slate-800 dark:text-white truncate">
                  {goal.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md ${
                    goal.category === 'year' ? 'bg-rose-500/10 text-rose-500' : 
                    goal.category === 'long-term' ? 'bg-indigo-500/10 text-indigo-500' : 
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {goal.category.replace('-', ' ')}
                  </span>
                  <p className="text-[10px] font-bold text-neutral-dark truncate">
                    Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </button>

              {goal.completed && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGoal(goal.id);
                  }}
                  className="size-8 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default TodoList;
