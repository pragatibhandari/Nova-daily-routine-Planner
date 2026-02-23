
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Task, PomodoroConfig, FocusMusicLink } from '../types';

interface PomodoroScreenProps {
  task?: Task;
  config: PomodoroConfig;
  onBack: () => void;
  onToggleStrict: () => void;
  musicLinks?: FocusMusicLink[];
  isMusicEnabled?: boolean;
  onToggleMusic?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const PomodoroScreen: React.FC<PomodoroScreenProps> = ({ 
  task, 
  config,
  onBack, 
  onToggleStrict,
  musicLinks = [],
  isMusicEnabled = false,
  onToggleMusic,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(config.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isStrict, setIsStrict] = useState(task?.strictMode || false);
  const [selectedMusicIndex, setSelectedMusicIndex] = useState(0);

  const timerRef = useRef<number | null>(null);

  const currentMusic = useMemo(() => musicLinks[selectedMusicIndex], [musicLinks, selectedMusicIndex]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const switchMode = useCallback((nextMode: PomodoroMode) => {
    setMode(nextMode);
    let duration = config.workDuration;
    if (nextMode === 'shortBreak') duration = config.shortBreakDuration;
    if (nextMode === 'longBreak') duration = config.longBreakDuration;
    setTimeLeft(duration * 60);
    
    const shouldAutoStart = nextMode === 'work' ? config.autoStartPomodoros : config.autoStartBreaks;
    setIsActive(shouldAutoStart);
  }, [config]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (mode === 'work') {
        const nextCount = pomodoroCount + 1;
        setPomodoroCount(nextCount);
        if (nextCount % config.longBreakInterval === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, pomodoroCount, config, switchMode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    let duration = config.workDuration;
    if (mode === 'shortBreak') duration = config.shortBreakDuration;
    if (mode === 'longBreak') duration = config.longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    let total = config.workDuration;
    if (mode === 'shortBreak') total = config.shortBreakDuration;
    if (mode === 'longBreak') total = config.longBreakDuration;
    return ((total * 60 - timeLeft) / (total * 60)) * 100;
  }, [timeLeft, mode, config]);

  if (isMinimized) {
    return (
      <div 
        onClick={onToggleMinimize}
        className={`fixed bottom-24 right-6 z-[100] size-16 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-2xl transition-all hover:scale-110 active:scale-95 animate-in zoom-in-50 duration-300 ${
          mode === 'work' ? 'bg-primary' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-indigo-600'
        } text-white`}
      >
        <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
        <svg className="absolute inset-0 size-full -rotate-90">
          <circle 
            cx="32" cy="32" r="28" 
            fill="transparent" 
            stroke="white" 
            strokeWidth="3" 
            strokeDasharray={176}
            strokeDashoffset={176 - (176 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[10px] font-black tabular-nums z-10">{formatTime(timeLeft)}</span>
        <span className="material-symbols-outlined text-[10px] z-10 opacity-60">
          {isActive ? 'pause' : 'play_arrow'}
        </span>
        
        {isMusicEnabled && isActive && currentMusic && (
          <div className="hidden">
            <iframe 
              key={currentMusic.id}
              width="0" 
              height="0" 
              src={`https://www.youtube.com/embed/${getYoutubeId(currentMusic.url)}?autoplay=1&loop=1&playlist=${getYoutubeId(currentMusic.url)}`} 
              allow="autoplay"
            ></iframe>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[110] flex flex-col h-screen transition-colors duration-700 ${
      mode === 'work' ? 'bg-primary' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-indigo-600'
    } text-white overflow-hidden`}>
      <header className="p-6 flex items-center justify-between z-10">
        {!isStrict && (
          <button onClick={onToggleMinimize} className="size-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <span className="material-symbols-outlined">close_fullscreen</span>
          </button>
        )}
        <div className="flex-1 text-center">
          <h2 className="font-black uppercase tracking-widest text-[10px] opacity-60 mb-1">Active Routine</h2>
          <p className="font-bold text-lg truncate px-4">{task?.name || 'Pomodoro Session'}</p>
        </div>
        <button 
          onClick={() => {
            setIsStrict(!isStrict);
            onToggleStrict();
          }} 
          className={`size-12 flex items-center justify-center rounded-full transition-all ${isStrict ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : 'bg-white/10 hover:bg-white/20'}`}
        >
          <span className="material-symbols-outlined">{isStrict ? 'lock' : 'lock_open'}</span>
        </button>
      </header>

      {isMusicEnabled && isActive && currentMusic && (
        <div className="hidden">
          <iframe 
            key={currentMusic.id}
            width="0" 
            height="0" 
            src={`https://www.youtube.com/embed/${getYoutubeId(currentMusic.url)}?autoplay=1&loop=1&playlist=${getYoutubeId(currentMusic.url)}`} 
            allow="autoplay"
          ></iframe>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="relative size-[300px] flex items-center justify-center">
          <svg className="absolute inset-0 size-full -rotate-90">
            <circle 
              cx="150" cy="150" r="140" 
              fill="transparent" 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="8" 
            />
            <circle 
              cx="150" cy="150" r="140" 
              fill="transparent" 
              stroke="white" 
              strokeWidth="8" 
              strokeDasharray={880}
              strokeDashoffset={880 - (880 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <div className="text-center z-10">
            <p className="text-7xl font-black tracking-tighter tabular-nums mb-2">
              {formatTime(timeLeft)}
            </p>
            <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-60">
              {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <button 
            onClick={onToggleMusic}
            className={`size-14 flex items-center justify-center rounded-full transition-all active:scale-90 ${isMusicEnabled ? 'bg-white text-primary' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title="Toggle Music"
          >
            <span className="material-symbols-outlined text-3xl">{isMusicEnabled ? 'music_note' : 'music_off'}</span>
          </button>

          <button 
            onClick={resetTimer}
            className="size-14 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-3xl">replay</span>
          </button>
          
          <button 
            onClick={toggleTimer}
            className="size-24 flex items-center justify-center bg-white text-slate-900 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-5xl font-bold">
              {isActive ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button 
            onClick={() => switchMode(mode === 'work' ? 'shortBreak' : 'work')}
            className="size-14 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-3xl">skip_next</span>
          </button>

          {musicLinks.length > 1 && (
            <button 
              onClick={() => setSelectedMusicIndex((selectedMusicIndex + 1) % musicLinks.length)}
              className="size-14 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
              title="Next Track"
            >
              <span className="material-symbols-outlined text-3xl">queue_music</span>
            </button>
          )}
        </div>

        {isMusicEnabled && currentMusic && (
          <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Now Playing</p>
            <p className="text-sm font-bold">{currentMusic.title}</p>
          </div>
        )}

        {!isStrict && (
          <button 
            onClick={onBack}
            className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-xs font-black uppercase tracking-widest transition-all"
          >
            Stop Session
          </button>
        )}

        <div className="mt-12 flex gap-2">
          {Array.from({ length: config.longBreakInterval }).map((_, i) => (
            <div 
              key={i} 
              className={`size-3 rounded-full border-2 border-white/20 transition-all ${
                i < (pomodoroCount % config.longBreakInterval) ? 'bg-white border-white' : ''
              }`} 
            />
          ))}
        </div>
      </main>

      <footer className="p-12 text-center">
        <p className="text-xs font-bold opacity-40 uppercase tracking-widest">
          {pomodoroCount} Pomodoros Completed
        </p>
      </footer>

      {isStrict && (
        <div className="absolute inset-x-0 bottom-20 flex justify-center animate-bounce">
          <p className="bg-rose-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
            Strict Mode Active
          </p>
        </div>
      )}
    </div>
  );
};

export default PomodoroScreen;
