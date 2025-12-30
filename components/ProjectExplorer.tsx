
import React, { useState } from 'react';
import { FileNode, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ProjectExplorerProps {
  files: FileNode[];
  language: Language;
  onFileSelect: (path: string) => void;
}

const getFileIcon = (name: string) => {
  if (name.endsWith('.cpp') || name.endsWith('.hpp')) return { char: 'C++', color: 'text-blue-400' };
  if (name.endsWith('.py')) return { char: 'Py', color: 'text-amber-400' };
  if (name.endsWith('.go')) return { char: 'Go', color: 'text-cyan-400' };
  if (name.endsWith('.lua')) return { char: '☾', color: 'text-indigo-400' };
  if (name.endsWith('.md')) return { char: 'M↓', color: 'text-slate-400' };
  if (name.endsWith('.yaml') || name.endsWith('.json')) return { char: '{}', color: 'text-emerald-400' };
  return { char: '•', color: 'text-slate-500' };
};

const FileItem: React.FC<{ node: FileNode; depth: number; onSelect: (path: string) => void }> = ({ node, depth, onSelect }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const icon = getFileIcon(node.name);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') setIsOpen(!isOpen);
    else onSelect(node.path);
  };

  return (
    <div className="select-none">
      <div 
        onClick={toggle}
        className={`flex items-center py-1.5 px-3 cursor-pointer hover:bg-white/5 transition-all duration-150 rounded-lg group ${depth > 0 ? 'ml-1' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span className={`mr-2.5 text-[10px] font-black transition-transform duration-300 ${node.type === 'folder' ? (isOpen ? 'rotate-90 text-emerald-500' : 'text-slate-600') : 'text-slate-700'}`}>
          {node.type === 'folder' ? '▶' : ''}
        </span>
        
        {node.type === 'file' && (
          <span className={`mr-2 text-[8px] font-black px-1 rounded bg-black/40 border border-white/5 ${icon.color}`}>
            {icon.char}
          </span>
        )}

        <span className={`text-[11px] tracking-tight ${node.type === 'folder' ? 'text-slate-300 font-bold uppercase' : 'text-slate-400 group-hover:text-slate-200'}`}>
          {node.name}
        </span>
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div className="border-l border-slate-800/50 ml-[18px]">
          {node.children.map((child) => (
            <FileItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ files, language, onFileSelect }) => {
  const t = TRANSLATIONS[language];
  return (
    <div className="flex flex-col h-full bg-[#030307] border-r border-slate-800/40 w-72 shadow-2xl z-20">
      <div className="p-5 border-b border-slate-800/40 flex justify-between items-center bg-slate-950/20">
        <div className="flex flex-col">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{t.projectHierarchy}</h3>
           <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Terraformer_Core_v1</span>
        </div>
        <div className="flex space-x-2">
           <button className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors bg-slate-900/50 rounded-md border border-slate-800">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
           </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-hide bg-gradient-to-b from-transparent to-black/20">
        {files.map((node) => (
          <FileItem key={node.id} node={node} depth={0} onSelect={onFileSelect} />
        ))}
      </div>
    </div>
  );
};
