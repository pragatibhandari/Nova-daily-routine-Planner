
import React, { useMemo, useRef, useEffect } from 'react';

interface DateHeaderProps {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
}

const DateHeader: React.FC<DateHeaderProps> = ({ selectedDate, setSelectedDate }) => {
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    // Show 14 days starting from 7 days ago
    for (let i = -7; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        full: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return arr;
  }, []);

  const currentMonth = useMemo(() => {
    const selected = dates.find(d => d.full === selectedDate);
    return selected ? selected.month : dates[7].month;
  }, [selectedDate, dates]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the selected date into view on mount if possible
    const selectedEl = scrollRef.current?.querySelector('[data-selected="true"]');
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-5 pb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
          <h1 className="text-xl font-bold tracking-tight">{currentMonth}</h1>
        </div>
        <button 
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="bg-primary/10 dark:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold border border-primary/20 active:scale-95 transition-transform"
        >
          Today
        </button>
      </div>
      
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 scroll-smooth">
        {dates.map((item) => {
          const isSelected = selectedDate === item.full;
          return (
            <div 
              key={item.full}
              data-selected={isSelected}
              onClick={() => setSelectedDate(item.full)}
              className={`flex flex-col items-center justify-center min-w-[60px] h-20 rounded-xl cursor-pointer transition-all border ${
                isSelected 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 z-10' 
                  : 'bg-white dark:bg-card-dark border-slate-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'opacity-80' : 'text-neutral-dark'}`}>
                {item.day}
              </span>
              <span className={`text-lg font-bold ${isSelected ? '' : 'text-slate-900 dark:text-white'}`}>
                {item.date}
              </span>
              {item.full === new Date().toISOString().split('T')[0] && !isSelected && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1"></div>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
};

export default DateHeader;
