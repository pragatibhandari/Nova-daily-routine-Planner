import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Task, RepeatOption } from '../types';

interface DateHeaderProps {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  tasks: Task[];
}

const DateHeader: React.FC<DateHeaderProps> = ({ selectedDate, setSelectedDate, tasks }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    // Show 14 days starting from 7 days ago, expanding to 28 days total
    for (let i = -7; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        full: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
      });
    }
    return arr;
  }, []);

  const headerDateString = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }, [selectedDate]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const selectedEl = scrollRef.current?.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const handleGoToToday = () => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    setSelectedDate(localToday);
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Calendar logic
  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewMonth]);

  const hasTasksOnDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return tasks.some(t => {
      const taskDate = new Date(t.createdAt);
      if (t.repeat === RepeatOption.DAILY) return true;
      if (t.repeat === RepeatOption.WEEKLY) return taskDate.getDay() === date.getDay();
      if (t.repeat === RepeatOption.MONTHLY) return taskDate.getDate() === date.getDate();
      return t.createdAt === dateStr;
    });
  };

  const changeMonth = (offset: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1));
  };

  const selectCalendarDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setIsCalendarOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-5 pb-5 border-b border-slate-200 dark:border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div 
          className="flex flex-col gap-0.5 cursor-pointer active:scale-95 transition-transform"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">
              {headerDateString}
            </h1>
            <span className={`material-symbols-outlined text-neutral-dark text-[20px] transition-transform duration-300 ${isCalendarOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>
        </div>
        <button 
          onClick={handleGoToToday}
          className="bg-primary/10 dark:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold border border-primary/20 active:scale-95 transition-transform whitespace-nowrap"
        >
          Today
        </button>
      </div>

      {isCalendarOpen ? (
        <div className="mt-2 mb-4 bg-white dark:bg-card-dark rounded-3xl p-5 border border-slate-200 dark:border-white/5 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">
              {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button onClick={() => changeMonth(1)} className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-neutral-dark/50 uppercase py-2">
                {d}
              </div>
            ))}
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />;
              
              const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const hasTasks = hasTasksOnDate(date);
              const now = new Date();
              const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

              return (
                <button
                  key={i}
                  onClick={() => selectCalendarDate(date)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all group ${
                    isSelected 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110 z-10' 
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={`text-sm font-bold ${isToday && !isSelected ? 'text-primary' : ''}`}>
                    {date.getDate()}
                  </span>
                  {hasTasks && (
                    <div className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-primary'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 scroll-smooth">
          {dates.map((item) => {
            const isSelected = selectedDate === item.full;
            const now = new Date();
            const localToday = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            const isToday = item.full === localToday;
            
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
                {isToday && !isSelected && (
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default DateHeader;