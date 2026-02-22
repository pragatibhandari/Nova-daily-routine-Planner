
import React, { useState } from 'react';
import { ShoppingItem } from '../../types';

interface ShoppingFormProps {
  item: ShoppingItem | null;
  currency: string;
  onSave: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const CATEGORIES = ['Grocery', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Pharmacy', 'Other'];

const ShoppingForm: React.FC<ShoppingFormProps> = ({ item, currency, onSave, onDelete, onBack }) => {
  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(item?.quantity || '');
  const [category, setCategory] = useState(item?.category || 'Grocery');
  const [price, setPrice] = useState(item?.price?.toString() || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: item?.id || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      quantity: quantity.trim() || '1',
      category,
      price: price ? parseFloat(price) : undefined,
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
        <h2 className="font-bold text-lg">Shopping Item</h2>
        {item ? (
          <button onClick={() => onDelete(item.id)} className="size-10 flex items-center justify-center text-red-500 rounded-full hover:bg-red-500/10">
            <span className="material-symbols-outlined">delete</span>
          </button>
        ) : <div className="size-10" />}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Item Name</label>
            <input 
              type="text"
              placeholder="What do you need to buy?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-5 font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Quantity</label>
              <input 
                type="text"
                placeholder="e.g. 2kg, 1 pack"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-5 font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Est. Price ({currency})</label>
              <input 
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-5 font-bold outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl border text-[10px] font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-primary border-primary text-white' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-card-dark text-slate-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 pb-12 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 sticky bottom-0">
        <button 
          onClick={handleSave}
          className="w-full h-16 bg-primary text-white font-black text-lg rounded-[22px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Save Item
        </button>
      </footer>
    </div>
  );
};

export default ShoppingForm;
