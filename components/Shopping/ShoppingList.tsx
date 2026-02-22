
import React, { useMemo, useState } from 'react';
import { ShoppingItem } from '../../types';

interface ShoppingListProps {
  items: ShoppingItem[];
  currency: string;
  onToggle: (id: string) => void;
  onSelect: (item: ShoppingItem) => void;
  onAdd: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, currency, onToggle, onSelect, onAdd }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');

  const stats = useMemo(() => {
    return items.reduce((acc, curr) => {
      if (curr.completed) acc.completed++;
      else acc.pending++;
      if (curr.price) acc.total += curr.price;
      return acc;
    }, { pending: 0, completed: 0, total: 0 });
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => activeTab === 'completed' ? item.completed : !item.completed)
      .sort((a, b) => {
        if (sortBy === 'category') {
          return a.category.localeCompare(b.category);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [items, activeTab, sortBy]);

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-background-light dark:bg-background-dark">
      <header className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Shopping</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortBy(sortBy === 'date' ? 'category' : 'date')}
              className={`size-10 flex items-center justify-center rounded-full border transition-all ${sortBy === 'category' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}
              title={sortBy === 'category' ? 'Sorted by Category' : 'Sorted by Date'}
            >
              <span className="material-symbols-outlined text-xl">
                {sortBy === 'category' ? 'category' : 'calendar_today'}
              </span>
            </button>
            <button onClick={onAdd} className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              Add Item
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-card-dark rounded-[24px] p-4 border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-dark mb-1">Items Needed</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-card-dark rounded-[24px] p-4 border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-dark mb-1">Est. Total</p>
            <p className="text-2xl font-bold text-primary">{currency}{stats.total.toLocaleString()}</p>
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
            <span className="material-symbols-outlined text-6xl mb-4">shopping_basket</span>
            <p className="font-medium text-sm">No items in this list</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => (
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
                  {item.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-neutral-dark">
                    {item.quantity}
                  </span>
                  <p className="text-[10px] font-bold text-neutral-dark truncate">{item.category}</p>
                </div>
              </button>

              {item.price && (
                <div className="text-right">
                  <p className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">
                    {currency}{item.price.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default ShoppingList;
