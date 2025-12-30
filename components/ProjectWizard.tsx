
import React, { useState, useRef, useEffect } from 'react';
import { ArchitectService } from '../services/geminiService';
import { Language, FileNode } from '../types';

interface ProjectWizardProps {
  language: Language;
  onScaffold: (structure: FileNode[]) => void;
  onClose: () => void;
  forceLoading?: boolean;
}

export const ProjectWizard: React.FC<ProjectWizardProps> = ({ language, onScaffold, onClose, forceLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [isWorking, setIsWorking] = useState(forceLoading || false);
  const architect = useRef(new ArchitectService());

  useEffect(() => {
    if (forceLoading) setIsWorking(true);
  }, [forceLoading]);

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setIsWorking(true);
    const result = await architect.current.scaffoldProject(prompt);
    if (result) {
      onScaffold(result);
    } else {
      setIsWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)] flex flex-col">
        <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-10">
           <div className="flex flex-col">
              <span className="text-[12px] font-black text-white italic uppercase tracking-tighter">Architect Designer Mode</span>
              <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Scaffold v1.0 / Neural Core</span>
           </div>
           <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="flex-1 p-16 flex flex-col items-center justify-center space-y-12">
           {!isWorking ? (
             <>
               <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Describe your dream project</h2>
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Architect AI will generate a functional skeleton with logic and assets</p>
               </div>
               <div className="w-full relative group">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g. 'A 3D Cyberpunk MMORPG with character classes and open world'..."
                    className="w-full bg-slate-950/60 border-2 border-slate-800 p-10 rounded-3xl text-lg text-emerald-400 outline-none focus:border-emerald-500/50 transition-all font-mono resize-none h-48 placeholder:opacity-20"
                  />
                  <div className="absolute bottom-6 right-6">
                     <button 
                       onClick={handleStart}
                       className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
                     >
                        Initialize Scaffold
                     </button>
                  </div>
               </div>
             </>
           ) : (
             <div className="flex flex-col items-center space-y-8 animate-pulse">
                <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_40px_rgba(16,185,129,0.2)]" />
                <div className="text-center">
                   <h3 className="text-2xl font-black text-emerald-500 italic uppercase tracking-widest mb-2">Synthesizing Architecture...</h3>
                   <div className="flex space-x-2 justify-center">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-75" />
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-150" />
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-225" />
                   </div>
                </div>
                <div className="w-96 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-emerald-500 w-[45%] animate-[loading_5s_infinite]" />
                </div>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes loading {
                    0% { width: 0; }
                    50% { width: 80%; }
                    100% { width: 100%; }
                  }
                `}} />
             </div>
           )}
        </div>
        
        <div className="h-12 bg-slate-950 border-t border-slate-800 flex items-center px-10 text-[8px] text-slate-700 font-black uppercase tracking-widest">
           Secure Data Node: Isolated / Neural Training: Active / Compliance: Verified
        </div>
      </div>
    </div>
  );
};
