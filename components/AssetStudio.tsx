
import React, { useState, useRef } from 'react';
import { ArchitectService } from '../services/geminiService';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AssetStudioProps {
  language: Language;
  onImport: (name: string, type: string, analysis: any) => void;
}

export const AssetStudio: React.FC<AssetStudioProps> = ({ language, onImport }) => {
  const [prompt, setPrompt] = useState('Realistic orc warrior, high fidelity, battle-worn armor.');
  const [animPrompt, setAnimPrompt] = useState('Heavy overhead sword swing with impact shake');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizingAnim, setIsSynthesizingAnim] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [conceptImage, setConceptImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MESH' | 'ANIM'>('MESH');
  const [activePBR, setActivePBR] = useState<'ALBEDO' | 'NORMAL' | 'ROUGH'>('ALBEDO');
  const [showRig, setShowRig] = useState(true);
  const [motionLibrary, setMotionLibrary] = useState<any[]>([
    { id: 'idle-01', name: 'Idle_Standing', category: 'Locomotion', frames: 120, boneWeight: 'Full' },
    { id: 'run-01', name: 'Fast_Sprint', category: 'Locomotion', frames: 32, boneWeight: 'Full' }
  ]);
  const [selectedAnim, setSelectedAnim] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const architect = useRef(new ArchitectService());
  const t = TRANSLATIONS[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setConceptImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!conceptImage) return;
    setIsGenerating(true);
    const base64Data = conceptImage.split(',')[1];
    const mimeType = conceptImage.split(';')[0].split(':')[1];
    const result = await architect.current.analyzeConcept({ data: base64Data, mimeType }, prompt);
    if (result) setAnalysis(result);
    setIsGenerating(false);
  };

  const handleSynthesizeAnim = async () => {
    if (!animPrompt.trim()) return;
    setIsSynthesizingAnim(true);
    const result = await architect.current.synthesizeAnimation(animPrompt);
    if (result) {
      const newAnim = { ...result, id: `anim-${Date.now()}` };
      setMotionLibrary(prev => [newAnim, ...prev]);
      setAnimPrompt('');
    }
    setIsSynthesizingAnim(false);
  };

  return (
    <div className="w-full h-full bg-[#020205] flex flex-col overflow-hidden">
      <div className="h-14 border-b border-slate-800/40 bg-slate-950/20 flex items-center px-10 justify-between">
         <div className="flex space-x-8">
            <button onClick={() => setActiveTab('MESH')} className={`text-[10px] font-black uppercase tracking-[0.3em] py-4 ${activeTab === 'MESH' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}>{t.meshGen}</button>
            <button onClick={() => setActiveTab('ANIM')} className={`text-[10px] font-black uppercase tracking-[0.3em] py-4 ${activeTab === 'ANIM' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-600 hover:text-slate-400'}`}>{t.motionBank}</button>
         </div>
         <div className="flex items-center space-x-6 text-[9px] text-slate-700 font-black uppercase italic">
            Engine: <span className="text-emerald-600">Chimera_X_Gen</span>
         </div>
      </div>

      <div className="flex-1 p-8 flex space-x-10 overflow-hidden">
        {activeTab === 'MESH' ? (
          <>
            <div className="w-80 flex flex-col space-y-6 overflow-y-auto pr-2 scrollbar-hide">
                <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl space-y-6 shadow-2xl backdrop-blur-3xl">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t.loadConcept} (PNG/JPG)</label>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      <div onClick={() => fileInputRef.current?.click()} className="h-44 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center bg-black/20 group hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden relative">
                        {conceptImage ? <img src={conceptImage} className="w-full h-full object-cover opacity-60" /> : <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{t.loadConcept}</span>}
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t.directives}</label>
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full h-20 bg-black/40 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 outline-none resize-none font-mono" />
                   </div>
                   <button onClick={handleGenerate} disabled={isGenerating || !conceptImage} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-xl font-black uppercase text-[9px] italic transition-all">
                     {isGenerating ? t.synthesizing : t.startSynthesis}
                   </button>
                </div>

                {analysis && (
                  <div className="bg-blue-950/10 border border-blue-900/30 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                     <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4 italic">Neural Assessment</h4>
                     <div className="space-y-3 text-[9px] font-mono">
                        <div className="flex justify-between"><span className="text-slate-500">Geometry:</span> <span className="text-white">{analysis.polycount}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Rigging:</span> <span className="text-white">{analysis.bones} bones</span></div>
                        <div className="mt-4 text-[8px] text-slate-400 italic leading-relaxed">{analysis.technical_summary}</div>
                     </div>
                  </div>
                )}
            </div>

            <div className="flex-1 bg-black/40 border border-slate-800/60 rounded-3xl relative flex flex-col shadow-3xl overflow-hidden">
               <div className="flex-1 relative flex items-center justify-center">
                 {isGenerating ? (
                   <div className="text-center animate-pulse">
                      <div className="w-16 h-16 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">{t.synthesizing}</span>
                   </div>
                 ) : analysis ? (
                   <div className="w-full h-full p-8 flex flex-col animate-in zoom-in-95">
                      <div className="flex-1 border border-white/5 rounded-2xl bg-slate-950/40 relative overflow-hidden flex items-center justify-center">
                         <div className={`absolute inset-0 transition-all duration-700 flex items-center justify-center ${activePBR === 'ALBEDO' ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                            {conceptImage && <img src={conceptImage} className="max-w-full max-h-full object-contain" alt={t.assetPreview} />}
                         </div>

                         {/* Auto-Rigging Overlay Visualization */}
                         {showRig && (
                           <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                              <circle cx="50%" cy="30%" r="4" fill="#34d399" />
                              <circle cx="50%" cy="50%" r="4" fill="#34d399" />
                              <line x1="50%" y1="30%" x2="50%" y2="50%" stroke="#34d399" strokeWidth="2" />
                              <line x1="50%" y1="40%" x2="45%" y2="45%" stroke="#34d399" strokeWidth="2" />
                              <line x1="50%" y1="40%" x2="55%" y2="45%" stroke="#34d399" strokeWidth="2" />
                              <circle cx="45%" cy="45%" r="3" fill="#34d399" />
                              <circle cx="55%" cy="45%" r="3" fill="#34d399" />
                           </svg>
                         )}

                         <div className="absolute top-4 left-4 flex space-x-2">
                            {(['ALBEDO', 'NORMAL', 'ROUGH'] as const).map(layer => (
                               <button key={layer} onClick={() => setActivePBR(layer)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${activePBR === layer ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_#10b981]' : 'bg-black/60 border-slate-800 text-slate-500'}`}>{layer}</button>
                            ))}
                            <button onClick={() => setShowRig(!showRig)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${showRig ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/60 border-slate-800 text-slate-500'}`}>RIG</button>
                         </div>
                      </div>
                      <div className="h-20 mt-6 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[12px] font-black text-white italic uppercase tracking-tighter">Synthetic_Asset.tfasset</span>
                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">{t.weightsConverged}</span>
                         </div>
                         <button onClick={() => onImport("Generated_Asset", "Mesh", analysis)} className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase italic transition-all">{t.finalizeImport}</button>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center opacity-10">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">{t.neuralStandby}</span>
                   </div>
                 )}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col space-y-8 overflow-hidden">
            <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl flex items-center space-x-6 backdrop-blur-3xl shadow-2xl">
               <div className="flex-1 space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t.neuralMotion}</label>
                  <input 
                    type="text" 
                    value={animPrompt}
                    onChange={(e) => setAnimPrompt(e.target.value)}
                    placeholder={t.describeMotion}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all font-mono"
                  />
               </div>
               <button 
                onClick={handleSynthesizeAnim}
                disabled={isSynthesizingAnim || !animPrompt.trim()}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-30"
               >
                 {isSynthesizingAnim ? t.synthesizing : t.synthesizeAnimation}
               </button>
            </div>

            <div className="flex-1 grid grid-cols-4 gap-6 overflow-y-auto pr-4 scrollbar-hide">
              {motionLibrary.map(anim => (
                <div 
                  key={anim.id} 
                  onClick={() => setSelectedAnim(anim.id)}
                  className={`group bg-slate-900/40 border p-5 rounded-2xl flex flex-col space-y-4 cursor-pointer transition-all hover:border-blue-500/50 hover:bg-blue-500/5 ${selectedAnim === anim.id ? 'border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/10' : 'border-slate-800'} animate-in zoom-in-95`}
                >
                  <div className={`h-24 bg-black/40 rounded-xl flex items-center justify-center relative overflow-hidden ${selectedAnim === anim.id ? 'animate-pulse' : ''}`}>
                    <div className={`w-12 h-12 border-2 border-blue-500/30 rounded-full ${selectedAnim === anim.id ? 'scale-110' : ''}`} />
                    <span className="absolute bottom-2 right-2 text-[8px] text-slate-600 font-black">{anim.frames}f</span>
                    {selectedAnim === anim.id && <span className="absolute top-2 left-2 text-[7px] text-emerald-500 font-black italic">{t.motionPreview}</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white italic uppercase truncate">{anim.name}</span>
                    <div className="flex justify-between mt-2">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{anim.category}</span>
                        <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest italic">{anim.boneWeight}</span>
                    </div>
                  </div>
                  {selectedAnim === anim.id && (
                    <button className="w-full py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg animate-in fade-in slide-in-from-bottom-2">{t.addRetargeter}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
