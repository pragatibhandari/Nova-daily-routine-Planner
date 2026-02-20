
import React, { useState, useEffect } from 'react';
import { runDiagnosticSuite, TestResult } from './utils/testCases';

const TestView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const startSuite = async () => {
    setIsRunning(true);
    try {
      const suiteResults = await runDiagnosticSuite();
      setResults(suiteResults);
    } catch (error) {
      console.error("Test execution failed", error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    startSuite();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark animate-in fade-in duration-300">
      <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold">System Diagnostics</h1>
            <p className="text-[10px] font-black uppercase text-neutral-dark tracking-widest">Core Logic Validation</p>
          </div>
        </div>
        <button 
          onClick={startSuite} 
          disabled={isRunning}
          className="size-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 transition-all"
        >
          <span className={`material-symbols-outlined ${isRunning ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {isRunning ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-dark font-bold animate-pulse">Running test sequence...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((res, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300`}
                style={{ 
                  animationDelay: `${i * 40}ms`, 
                  borderColor: res.status === 'passed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                  backgroundColor: res.status === 'passed' ? 'transparent' : 'rgba(239, 68, 68, 0.02)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-xl flex items-center justify-center ${res.status === 'passed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <span className="material-symbols-outlined text-[18px]">{res.status === 'passed' ? 'check_circle' : 'error'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{res.name}</h4>
                    {res.message && <p className="text-[10px] text-red-500 font-medium mt-0.5">{res.message}</p>}
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${res.status === 'passed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {res.status}
                </div>
              </div>
            ))}
            
            {results.length > 0 && (
              <div className="pt-8 flex flex-col items-center gap-4">
                <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-dark uppercase tracking-widest">Total</p>
                    <p className="text-xl font-bold">{results.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Passed</p>
                    <p className="text-xl font-bold text-green-500">{results.filter(r => r.status === 'passed').length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Failed</p>
                    <p className="text-xl font-bold text-red-500">{results.filter(r => r.status === 'failed').length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TestView;
