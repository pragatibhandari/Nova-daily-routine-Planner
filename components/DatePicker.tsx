
import React, { useState, useMemo, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  maxDate?: string;
  minDate?: string;
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, maxDate, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedValue = useMemo(() => {
    if (!value) return 'Select Date';
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [value]);

  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewMonth]);

  const changeMonth = (offset: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1));
  };

  const selectDate = (date: Date) => {
    const dateStr = getLocalDateString(date);
    if (maxDate && dateStr > maxDate) return;
    if (minDate && dateStr < minDate) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const quickOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(new Date().setDate(new Date().getDate() + 1)) },
    { label: 'Next Week', date: new Date(new Date().setDate(new Date().getDate() + 7)) },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-neutral-dark pl-1 mb-2 block">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-5 flex items-center justify-between font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-primary/20 transition-all"
      >
        <span>{formattedValue}</span>
        <span className="material-symbols-outlined text-neutral-dark">calendar_today</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-card-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
            {quickOptions.map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => selectDate(opt.date)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-primary whitespace-nowrap hover:bg-primary/10 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm">
              {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button type="button" onClick={() => changeMonth(-1)} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-black text-neutral-dark/40 uppercase py-1">
                {d}
              </div>
            ))}
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />;
              
              const dateStr = getLocalDateString(date);
              const isSelected = value === dateStr;
              const isToday = getLocalDateString(new Date()) === dateStr;
              const isDisabled = (maxDate && dateStr > maxDate) || (minDate && dateStr < minDate);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(date)}
                  className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : isToday 
                        ? 'text-primary' 
                        : isDisabled 
                          ? 'opacity-10 cursor-not-allowed' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
