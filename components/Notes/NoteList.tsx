
import React, { useState } from 'react';
import { Note } from '../../types';

interface NoteListProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onAddNote: () => void;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onSelectNote, onAddNote }) => {
  const [search, setSearch] = useState('');

  const filtered = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-10 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">My Notes</h1>
          <div className="bg-primary/10 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{filtered.length} Notes</span>
          </div>
        </div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-dark group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text"
            placeholder="Search titles or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
      </header>

      <main className="flex-1 px-6 py-4">
        {filtered.length === 0 ? (
          <div className="py-20 text-center opacity-40 animate-in fade-in duration-700">
            <span className="material-symbols-outlined text-6xl mb-4">edit_note</span>
            <p className="font-medium">{search ? 'No matching notes found' : 'Your ideas deserve a home'}</p>
            <button 
              onClick={onAddNote}
              className="mt-4 text-primary text-xs font-bold uppercase tracking-widest underline underline-offset-4"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 items-start">
            {filtered.map((note, index) => (
              <button 
                key={note.id}
                onClick={() => onSelectNote(note)}
                style={{ animationDelay: `${index * 50}ms` }}
                className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-slate-100 dark:border-white/5 text-left transition-all hover:border-primary/30 active:scale-[0.98] shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight flex-1">
                    {note.title || 'Untitled'}
                  </h3>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">
                      {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[8px] font-bold text-neutral-dark/40 uppercase">
                      {new Date(note.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                </div>
                
                {note.content ? (
                  <p className="text-sm text-neutral-dark leading-relaxed opacity-80 whitespace-pre-wrap line-clamp-[8]">
                    {note.content}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 opacity-30 italic text-xs py-2">
                    <span className="material-symbols-outlined text-sm">sticky_note_2</span>
                    Empty note
                  </div>
                )}

                {/* Block indicators */}
                {note.blocks && note.blocks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-50 dark:border-white/5">
                    {Array.from(new Set(note.blocks.map(b => b.type))).map(type => {
                      const icon = type === 'checklist' ? 'fact_check' : type === 'table' ? 'table_chart' : type === 'doodle' ? 'brush' : 'notes';
                      return (
                        <div key={type} className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5">
                          <span className="material-symbols-outlined text-[14px] text-primary/60">{icon}</span>
                          <span className="text-[8px] font-black uppercase text-neutral-dark/80 tracking-tighter">{type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NoteList;
