
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Note, NoteBlock, NoteBlockType } from '../../types';

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const AutoExpandingTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  placeholder: string;
  className?: string;
}> = ({ value, onChange, onBlur, placeholder, className }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full bg-transparent border-none p-0 focus:ring-0 outline-none resize-none overflow-hidden ${className}`}
      rows={1}
    />
  );
};

const DoodleCanvas: React.FC<{ data: string; onChange: (data: string) => void }> = ({ data, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      canvas.width = containerRef.current.offsetWidth;
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineWidth = 3;
        context.strokeStyle = document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
        setCtx(context);
        
        if (data) {
          const img = new Image();
          img.onload = () => context.drawImage(img, 0, 0);
          img.src = data;
        }
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    ctx?.lineTo(pos.x, pos.y);
    ctx?.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clear = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      onChange('');
    }
  };

  return (
    <div ref={containerRef} className="relative border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-card-dark/20 overflow-hidden w-full">
      <canvas
        ref={canvasRef}
        height={250}
        className="w-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      <button onClick={clear} className="absolute top-2 right-2 size-10 flex items-center justify-center bg-white/80 dark:bg-background-dark/80 text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-all">
        <span className="material-symbols-outlined">delete_sweep</span>
      </button>
    </div>
  );
};

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onBack, onDelete }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [blocks, setBlocks] = useState<NoteBlock[]>(() => {
    if (note?.blocks && note.blocks.length > 0) return note.blocks;
    return [{ id: 'b1', type: 'text', data: note?.content || '' }];
  });

  const [history, setHistory] = useState<NoteBlock[][]>([]);
  const [future, setFuture] = useState<NoteBlock[][]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const pushToHistory = useCallback((newBlocks: NoteBlock[]) => {
    setHistory(prev => [...prev.slice(-20), blocks]);
    setFuture([]);
    setBlocks(newBlocks);
  }, [blocks]);

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [blocks, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setBlocks(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, blocks]);
    setFuture(prev => prev.slice(1));
    setBlocks(next);
  };

  const updateBlock = (id: string, newData: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: newData } : b));
  };

  const addBlock = (type: NoteBlockType) => {
    const newBlock: NoteBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data: type === 'checklist' ? [{ id: '1', text: '', checked: false }] 
           : type === 'table' ? { rows: [['', ''], ['', '']] }
           : type === 'doodle' ? '' 
           : ''
    };
    pushToHistory([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    if (blocks.length === 1 && blocks[0].type === 'text' && !blocks[0].data) return;
    pushToHistory(blocks.filter(b => b.id !== id));
  };

  const handleSave = () => {
    const summary = blocks
      .map(b => (b.type === 'text' ? b.data : b.type === 'checklist' ? b.data.map((i: any) => i.text).join(' ') : ''))
      .join(' ');
    
    onSave({
      id: note?.id || Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      content: summary.trim(),
      blocks,
      updatedAt: new Date().toISOString(),
      createdAt: note?.createdAt || new Date().toISOString()
    });
  };

  const handleDelete = () => {
    if (isConfirmingDelete && note) {
      onDelete(note.id);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark animate-in slide-in-from-right-10 duration-300">
      <header className="flex items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-1">
          <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button onClick={undo} disabled={history.length === 0} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-20 transition-opacity">
            <span className="material-symbols-outlined">undo</span>
          </button>
          <button onClick={redo} disabled={future.length === 0} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-20 transition-opacity">
            <span className="material-symbols-outlined">redo</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {note ? (
            <button 
              onClick={handleDelete} 
              className={`flex items-center gap-2 px-3 h-10 rounded-full transition-all duration-300 ${isConfirmingDelete ? 'bg-red-500 text-white shadow-lg' : 'text-red-400 hover:bg-red-400/10'}`}
            >
              <span className="material-symbols-outlined">{isConfirmingDelete ? 'warning' : 'delete'}</span>
              {isConfirmingDelete && <span className="text-[10px] font-black uppercase tracking-widest">Sure?</span>}
            </button>
          ) : (
            <button 
              onClick={onBack} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white px-3 h-10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Discard
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={!title.trim() && blocks.length === 0}
            className="bg-primary text-white px-6 h-10 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-30 transition-all"
          >
            Save
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <AutoExpandingTextarea 
            placeholder="Note Title"
            value={title}
            onChange={(val) => setTitle(val)}
            onBlur={() => {}}
            className="text-4xl font-bold placeholder:text-slate-200 dark:placeholder:text-white/10 tracking-tight leading-tight"
          />

          <div className="space-y-6">
            {blocks.map((block) => (
              <div key={block.id} className="relative group/block animate-in fade-in duration-500">
                <div className="absolute -left-12 top-0 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col items-center">
                  <button onClick={() => removeBlock(block.id)} className="size-8 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {block.type === 'text' && (
                  <AutoExpandingTextarea 
                    placeholder="Start typing..."
                    value={block.data}
                    onChange={(val) => updateBlock(block.id, val)}
                    onBlur={() => pushToHistory(blocks)}
                    className="text-lg leading-relaxed text-slate-700 dark:text-slate-200"
                  />
                )}

                {block.type === 'checklist' && (
                  <div className="space-y-3 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl">
                    {block.data.map((item: any, idx: number) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            const newData = [...block.data];
                            newData[idx].checked = !newData[idx].checked;
                            updateBlock(block.id, newData);
                            pushToHistory(blocks);
                          }}
                          className={`size-6 rounded-lg border transition-all flex items-center justify-center ${item.checked ? 'bg-primary border-primary shadow-sm shadow-primary/30' : 'border-slate-200 dark:border-white/10'}`}
                        >
                          {item.checked && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                        </button>
                        <input
                          type="text"
                          className={`flex-1 bg-transparent border-none p-0 focus:ring-0 text-base font-medium transition-all ${item.checked ? 'line-through opacity-40 italic' : 'text-slate-700 dark:text-slate-200'}`}
                          value={item.text}
                          onChange={(e) => {
                            const newData = [...block.data];
                            newData[idx].text = e.target.value;
                            updateBlock(block.id, newData);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const newData = [...block.data];
                              const newItem = { id: Math.random().toString(36).substr(2, 9), text: '', checked: false };
                              newData.splice(idx + 1, 0, newItem);
                              const newBlocks = blocks.map(b => b.id === block.id ? { ...b, data: newData } : b);
                              pushToHistory(newBlocks);
                            } else if (e.key === 'Backspace' && item.text === '' && block.data.length > 1) {
                              e.preventDefault();
                              const newData = block.data.filter((_: any, i: number) => i !== idx);
                              const newBlocks = blocks.map(b => b.id === block.id ? { ...b, data: newData } : b);
                              pushToHistory(newBlocks);
                            }
                          }}
                          onBlur={() => {}}
                          placeholder="List item..."
                          autoFocus={item.text === '' && !item.checked}
                        />
                        <button onClick={() => {
                          const newData = block.data.filter((_: any, i: number) => i !== idx);
                          if (newData.length === 0) {
                            removeBlock(block.id);
                          } else {
                            const newBlocks = blocks.map(b => b.id === block.id ? { ...b, data: newData } : b);
                            pushToHistory(newBlocks);
                          }
                        }} className="size-8 text-slate-300 hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-sm">close</span></button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-4 mt-2 pl-9">
                      <button onClick={() => {
                        const newData = [...block.data, { id: Math.random().toString(36).substr(2, 9), text: '', checked: false }];
                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, data: newData } : b);
                        pushToHistory(newBlocks);
                      }} className="text-primary text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add_task</span> Add item
                      </button>
                    </div>
                  </div>
                )}

                {block.type === 'table' && (
                  <div className="overflow-x-auto border border-slate-100 dark:border-white/5 rounded-[24px] p-4 bg-slate-50 dark:bg-white/5">
                    <table className="w-full border-collapse">
                      <tbody>
                        {block.data.rows.map((row: string[], rIdx: number) => (
                          <tr key={rIdx}>
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="border border-slate-200 dark:border-white/10 p-0">
                                <AutoExpandingTextarea
                                  className="w-full bg-transparent p-3 text-xs focus:bg-primary/5 min-w-[120px]"
                                  value={cell}
                                  placeholder="Cell data"
                                  onChange={(val) => {
                                    const newRows = [...block.data.rows];
                                    newRows[rIdx][cIdx] = val;
                                    updateBlock(block.id, { rows: newRows });
                                  }}
                                  onBlur={() => pushToHistory(blocks)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex gap-4 mt-4 px-2">
                      <button onClick={() => {
                        const newRows = [...block.data.rows, Array(block.data.rows[0].length).fill('')];
                        updateBlock(block.id, { rows: newRows });
                        pushToHistory(blocks);
                      }} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">add</span> Row
                      </button>
                      <button onClick={() => {
                        const newRows = block.data.rows.map((r: string[]) => [...r, '']);
                        updateBlock(block.id, { rows: newRows });
                        pushToHistory(blocks);
                      }} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">add</span> Column
                      </button>
                    </div>
                  </div>
                )}

                {block.type === 'doodle' && (
                  <DoodleCanvas data={block.data} onChange={(data) => {
                    updateBlock(block.id, data);
                    pushToHistory(blocks);
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="p-4 pb-10 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2">
        <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl flex items-center shadow-inner">
          <button onClick={() => addBlock('text')} className="size-12 flex flex-col items-center justify-center text-neutral-dark hover:text-primary hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all">
            <span className="material-symbols-outlined">title</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Text</span>
          </button>
          <button onClick={() => addBlock('checklist')} className="size-12 flex flex-col items-center justify-center text-neutral-dark hover:text-primary hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all">
            <span className="material-symbols-outlined">fact_check</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">List</span>
          </button>
          <button onClick={() => addBlock('table')} className="size-12 flex flex-col items-center justify-center text-neutral-dark hover:text-primary hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all">
            <span className="material-symbols-outlined">grid_view</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Table</span>
          </button>
          <button onClick={() => addBlock('doodle')} className="size-12 flex flex-col items-center justify-center text-neutral-dark hover:text-primary hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all">
            <span className="material-symbols-outlined">draw</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Doodle</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default NoteEditor;
