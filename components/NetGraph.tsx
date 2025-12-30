
import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface NetGraphProps {
  nodes: any[];
  language: Language;
  onAddNode: (desc: string) => void;
  onGenerateCode: (nodeName: string, data: any) => void;
}

export const NetGraph: React.FC<NetGraphProps> = ({ nodes, language, onAddNode, onGenerateCode }) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const t = TRANSLATIONS[language];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNodeDesc.trim()) {
      onAddNode(newNodeDesc);
      setNewNodeDesc('');
    }
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  const connections = useMemo(() => {
    const list = [];
    const events = nodes.filter(n => n.type === 'EVENT');
    const handlers = nodes.filter(n => n.type === 'HANDLER');

    for (let e of events) {
      for (let h of handlers) {
        const nameShared = e.name.toLowerCase().includes(h.name.toLowerCase().replace('on', '').replace('handler', '')) || 
                           h.name.toLowerCase().includes(e.name.toLowerCase());
        
        const directionMatch = (e.direction === 'C2S' && h.direction === 'S2C') || 
                               (e.direction === 'S2C' && h.direction === 'INTERNAL');

        if (nameShared || directionMatch) {
          list.push({ from: e, to: h });
        }
      }
    }
    return list;
  }, [nodes]);

  return (
    <div className="w-full h-full bg-[#030307] relative overflow-hidden flex items-center justify-center group">
      <div className="absolute inset-0 opacity-5" 
           style={{ backgroundImage: 'linear-gradient(#2d3748 1px, transparent 1px), linear-gradient(90deg, #2d3748 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="absolute top-8 left-8 z-30">
        <form onSubmit={handleAdd} className="flex bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <input 
            type="text" 
            value={newNodeDesc}
            onChange={(e) => setNewNodeDesc(e.target.value)}
            placeholder={t.addNode}
            className="bg-transparent px-5 py-3 text-[10px] text-white outline-none w-64 italic font-mono"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 text-[9px] font-black uppercase tracking-widest text-white transition-all border-l border-blue-500/50">
            {t.synthesizeNode}
          </button>
        </form>
      </div>

      <div className="relative w-full h-full cursor-crosshair overflow-auto">
        {nodes.map(node => (
          <div 
            key={node.id}
            onClick={() => setActiveNodeId(node.id)}
            style={{ left: node.x, top: node.y }}
            className={`absolute w-60 bg-slate-900/90 border transition-all duration-300 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer hover:scale-105 active:scale-95 z-20 ${activeNodeId === node.id ? 'border-blue-500 ring-8 ring-blue-500/5' : 'border-slate-800'}`}
          >
             <div className={`p-2.5 text-[10px] font-black border-b flex justify-between uppercase italic tracking-widest ${activeNodeId === node.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                <span>{node.type}: {node.name}</span>
                <span className="text-[8px] opacity-60 bg-black/40 px-1.5 rounded">{node.direction}</span>
             </div>
             <div className="p-4 space-y-3 bg-slate-950/40">
                {node.params.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[9px] group/item">
                     <span className="text-slate-400 font-mono italic">{p.name}</span>
                     <span className="text-blue-500/60 font-black italic uppercase tracking-tighter">{p.type}</span>
                  </div>
                ))}
                
                {activeNodeId === node.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onGenerateCode(node.name, node); }}
                    className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg italic"
                  >
                    {t.synthesizeModule}
                  </button>
                )}
             </div>
          </div>
        ))}

        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
           {connections.map((conn, i) => (
             <path 
                key={i}
                d={`M${conn.from.x + 240} ${conn.from.y + 40} C ${conn.from.x + 340} ${conn.from.y + 40}, ${conn.to.x - 100} ${conn.to.y + 40}, ${conn.to.x} ${conn.to.y + 40}`} 
                stroke={activeNodeId === conn.from.id || activeNodeId === conn.to.id ? "#10b981" : "#3b82f6"} 
                strokeWidth={activeNodeId === conn.from.id || activeNodeId === conn.to.id ? "2.5" : "1.5"} 
                fill="none" 
                className="transition-all duration-300"
             />
           ))}
        </svg>
      </div>

      {activeNodeId && activeNode && (
          <div className="absolute bottom-8 right-8 w-80 bg-slate-950/95 border border-slate-800 p-6 rounded-2xl animate-in slide-in-from-right-10 duration-500 shadow-3xl backdrop-blur-3xl z-40">
              <div className="flex justify-between items-center mb-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">{t.topology}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Target: {activeNode.name}</span>
                  </div>
                  <button onClick={() => setActiveNodeId(null)} className="text-slate-600 hover:text-white transition-colors bg-white/5 p-1 rounded">✕</button>
              </div>
              <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800/50">
                      <div className="text-[8px] text-slate-500 uppercase font-black mb-2 italic">{t.recArch}</div>
                      <p className="text-[9px] text-slate-400 leading-relaxed italic">
                        {language === 'RU' 
                          ? `Поток протокола узла ${activeNode.name} ${connections.filter(c => c.from.id === activeNode.id || c.to.id === activeNode.id).length > 0 ? 'полностью связан' : 'изолирован'}. Убедитесь, что сериализация пакетов использует Delta-сжатие.`
                          : `Node ${activeNode.name} protocol flow is ${connections.filter(c => c.from.id === activeNode.id || c.to.id === activeNode.id).length > 0 ? 'fully bridged' : 'isolated'}. Ensure packet serialization uses Delta compression.`
                        }
                      </p>
                  </div>
                  <div className="flex space-x-2">
                     <div className="flex-1 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                     </div>
                     <span className="text-[8px] text-blue-500 font-black">PROT_VERIFIED</span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
