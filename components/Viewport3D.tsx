
import React, { useEffect, useState } from 'react';
import { ProjectProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Viewport3DProps {
  profile: ProjectProfile;
  render2D: boolean;
  complexity: number;
  language: Language;
}

type DebugMode = 'LIT' | 'WIREFRAME' | 'COMPLEXITY' | 'LOD';

export const Viewport3D: React.FC<Viewport3DProps> = ({ profile, render2D, complexity, language }) => {
  const isMobile = profile === ProjectProfile.ANDROID_MID;
  const isAAA = profile === ProjectProfile.PC_AAA;
  const [pixelScale, setPixelScale] = useState(1);
  const [debugMode, setDebugMode] = useState<DebugMode>('LIT');
  const [fps, setFps] = useState(60);
  const [draws, setDraws] = useState(4000);
  const [gpuMem, setGpuMem] = useState(0);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setPixelScale(isMobile ? 0.7 : 1);
  }, [profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      const maxFps = isAAA ? 165 : isMobile ? 60 : 90;
      const complexityTax = complexity * 0.15;
      let targetFps = Math.max(isMobile ? 30 : 60, maxFps - complexityTax);
      let targetDraws = complexity * 150;
      if (isMobile) targetDraws = Math.min(targetDraws, 2000);
      if (isAAA) targetDraws = targetDraws * 2.5;

      if (debugMode === 'WIREFRAME') targetFps += 15;
      if (debugMode === 'COMPLEXITY') {
        targetFps *= 0.6;
        targetDraws *= 1.8;
      }

      setFps(Math.floor(targetFps + (Math.random() * 2 - 1)));
      setDraws(Math.floor(targetDraws + (Math.random() * 50 - 25)));
      setGpuMem(Math.floor((isAAA ? 4000 : 1200) + complexity * 20));
    }, 500);
    return () => clearInterval(interval);
  }, [profile, debugMode, complexity]);

  return (
    <div className={`w-full h-full relative overflow-hidden transition-all duration-1000 ${isMobile ? 'bg-[#0f0f15]' : 'bg-[#010103]'} group`}>
      {/* Visual Degradation Overlay for Mobile */}
      {isMobile && debugMode === 'LIT' && (
          <div className="absolute inset-0 pointer-events-none z-10 opacity-40 mix-blend-overlay" 
               style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, black 1px, black 2px)', backgroundSize: '100% 2px' }} />
      )}

      {/* Trace Reflection Simulator for AAA */}
      {isAAA && debugMode === 'LIT' && (
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-t from-emerald-500/10 to-transparent animate-pulse z-10" />
      )}

      {/* ChimeraRender Grid */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isAAA ? 'opacity-30' : 'opacity-10'}`} 
           style={{ 
             backgroundImage: render2D 
               ? 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)'
               : 'radial-gradient(#475569 1px, transparent 1px)', 
             backgroundSize: isMobile ? '80px 80px' : '40px 40px',
             filter: isAAA ? 'blur(0.5px) brightness(1.5)' : 'none'
           }} />
      
      <div className="absolute inset-0 flex items-center justify-center transition-transform duration-1000" style={{ transform: `scale(${pixelScale})` }}>
        {render2D ? (
          <div className="w-64 h-64 border-2 border-dashed border-blue-500/30 flex items-center justify-center animate-pulse relative">
            <span className="text-[10px] text-blue-400 font-black tracking-[0.5em] uppercase italic">SpriteRenderCore Active</span>
            <div className="absolute -top-4 -left-4 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
            <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
          </div>
        ) : (
          <div className="relative w-96 h-96">
            {/* Bloom Effect for AAA */}
            {isAAA && debugMode === 'LIT' && (
                <div className="absolute -inset-20 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" />
            )}

            <div className={`absolute inset-0 border-2 transition-all duration-1000 rounded-3xl animate-[spin_20s_linear_infinite] 
                ${debugMode === 'WIREFRAME' ? 'border-emerald-500/40 border-dashed' : 
                  debugMode === 'COMPLEXITY' ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]' :
                  isAAA ? 'border-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.2)]' : 'border-slate-800'}`} />
            
            <div className="absolute inset-0 flex items-center justify-center">
               <div className={`w-48 h-48 bg-gradient-to-br transition-all duration-1000 backdrop-blur-3xl border rounded-3xl flex flex-col items-center justify-center space-y-4 z-10 shadow-2xl
                  ${debugMode === 'COMPLEXITY' ? 'from-red-950/40 to-red-600/20 border-red-500/40' :
                    debugMode === 'WIREFRAME' ? 'from-black/80 to-black border-emerald-500/20' :
                    isAAA ? 'from-emerald-500/10 to-blue-600/10 border-white/10' : 'from-slate-900 to-black border-slate-800'}`}>
                  
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors duration-1000 ${isMobile ? 'text-amber-500/60' : 'text-slate-400'}`}>
                      {debugMode === 'LIT' ? (isMobile ? 'ASTC_MOBILE_LOD' : isAAA ? 'DX12_ULTIMATE_RT' : 'GL_CORE') : `DEBUG_${debugMode}`}
                    </span>
                    <div className={`h-0.5 w-16 mt-2 transition-all duration-1000 ${debugMode === 'COMPLEXITY' ? 'bg-red-500 animate-ping' : isAAA ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-slate-700'} rounded-full`} />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-6 left-6 flex flex-col space-y-4 z-20">
         <div className="bg-[#050508]/90 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-2xl border-l-4 border-l-emerald-500/50 min-w-[220px]">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Chimera HUD</span>
               <div className={`w-2 h-2 rounded-full ${isMobile ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
            </div>
            <div className="space-y-3 font-mono text-[10px]">
               <div className="flex justify-between items-center group">
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors uppercase">Backend:</span>
                  <span className="text-blue-400 font-bold">{isAAA ? 'VULKAN_RT' : isMobile ? 'GLES_3.2' : 'VULKAN_1.3'}</span>
               </div>
               <div className="flex justify-between items-center group">
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors uppercase">Shading:</span>
                  <span className="text-slate-400 font-bold">{isAAA ? 'VRS_ACTIVE' : 'DEFAULT'}</span>
               </div>
               <div className="flex justify-between items-center group">
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors uppercase">GPU Mem:</span>
                  <span className="text-amber-500">{(gpuMem / 1024).toFixed(2)} GB</span>
               </div>
               {isAAA && (
                 <div className="flex justify-between items-center group text-emerald-500/80">
                   <span className="uppercase">RayTracing:</span>
                   <span className="font-bold">ACTIVE</span>
                 </div>
               )}
            </div>
         </div>

         <div className="bg-[#050508]/80 border border-slate-800 p-2.5 rounded-xl flex items-center space-x-4">
            {(['LIT', 'WIREFRAME', 'COMPLEXITY', 'LOD'] as DebugMode[]).map(mode => (
                <button key={mode} onClick={() => setDebugMode(mode)} className={`px-3 py-2 rounded-lg transition-all ${debugMode === mode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-600 hover:text-slate-400'}`}>
                  <span className="text-[9px] font-black uppercase tracking-tighter italic">{mode}</span>
                </button>
            ))}
         </div>
      </div>

      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
         <div className="flex space-x-1 items-end h-8">
            {Array.from({length: 20}).map((_, i) => (
               <div key={i} className={`w-1 rounded-t-sm transition-all duration-300 ${isAAA ? 'bg-emerald-500/40' : 'bg-slate-700/40'}`} style={{ height: `${Math.random() * 100}%` }} />
            ))}
         </div>
         <span className="text-[7px] text-slate-700 font-mono uppercase mt-1 block">Frame_Logic_Profiler: OK</span>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center space-x-4 z-20">
         <div className="bg-slate-950/90 border border-slate-800 p-3 px-6 rounded-2xl flex items-center space-x-8 shadow-2xl font-mono text-[10px] backdrop-blur-md">
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-600 uppercase italic">FPS</span>
                <span className={`font-bold transition-colors ${fps < 60 ? 'text-red-500' : 'text-emerald-500'}`}>{fps}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-600 uppercase italic">Draws</span>
                <span className="text-blue-400 font-bold">{draws > 1000 ? `${(draws/1000).toFixed(1)}k` : draws}</span>
            </div>
         </div>
      </div>
    </div>
  );
};
