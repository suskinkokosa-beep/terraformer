
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ProjectExplorer } from './components/ProjectExplorer';
import { ArchitectPanel } from './components/ArchitectPanel';
import { Viewport3D } from './components/Viewport3D';
import { NetGraph } from './components/NetGraph';
import { AssetStudio } from './components/AssetStudio';
import { ServerOrchestrator } from './components/ServerOrchestrator';
import { ProjectWizard } from './components/ProjectWizard';
import { Language, ProjectProfile, ProjectState, WorkspaceTab, FileNode, AISuggestion, DiagnosticIssue } from './types';
import { INITIAL_FILE_STRUCTURE, TRANSLATIONS } from './constants';
import { ArchitectService } from './services/geminiService';

const App: React.FC = () => {
  const architect = useRef(new ArchitectService());
  const [project, setProject] = useState<ProjectState>({
    name: 'Terraformer MMORPG',
    profile: ProjectProfile.PC_AAA,
    language: 'RU',
    render2D: false,
    issues: [] 
  });
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('SCENE');
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [logs, setLogs] = useState<string[]>(['[System] Terraformer Studio v1.1.0 Ready', '[Kernel] Hybrid Renderer Chimera initialized']);
  const [terminalInput, setTerminalInput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>(INITIAL_FILE_STRUCTURE);
  const [builds, setBuilds] = useState<any[]>([]);

  const [netNodes, setNetNodes] = useState<any[]>([
    { id: 'node-trade', name: 'PlayerTrade', type: 'EVENT', direction: 'C2S', params: [{ name: 'player_uid', type: 'UInt64' }], x: 150, y: 150 },
    { id: 'node-auth', name: 'OnAuthSuccess', type: 'HANDLER', direction: 'S2C', params: [{ name: 'session_token', type: 'String' }], x: 450, y: 100 }
  ]);

  const t = TRANSLATIONS[project.language];

  const projectComplexity = useMemo(() => {
    let count = 0;
    const walk = (nodes: FileNode[]) => nodes.forEach(n => { count++; if (n.children) walk(n.children); });
    walk(fileStructure);
    return count + netNodes.length * 5;
  }, [fileStructure, netNodes]);

  const toggleLanguage = () => setProject(prev => ({ ...prev, language: prev.language === 'EN' ? 'RU' : 'EN' }));

  const handleUpdateFileContent = (content: string) => {
    if (!activeFile) return;
    setFileStructure(prev => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === activeFile.path) return { ...node, content };
          if (node.children) return { ...node, children: updateNode(node.children) };
          return node;
        });
      };
      return updateNode(prev);
    });
    setActiveFile(prev => prev ? { ...prev, content } : null);
  };

  const handleScaffold = (newStructure: FileNode[]) => {
    setFileStructure(newStructure);
    setShowWizard(false);
    setIsSynthesizing(false);
    setLogs(prev => [...prev, `[Architect] Project scaffolded successfully.`, `[Architect] 24 modules integrated into kernel.`]);
  };

  const handleDirectSynthesis = async (prompt: string) => {
    setIsSynthesizing(true);
    setLogs(prev => [...prev, `[Architect] Direct Synthesis initiated: ${prompt.substring(0, 30)}...`]);
    const result = await architect.current.scaffoldProject(prompt);
    if (result) {
      handleScaffold(result);
      setActiveTab('SCENE');
    } else {
      setIsSynthesizing(false);
      setLogs(prev => [...prev, `[Error] Synthesis failed. Weights check failed.`]);
    }
  };

  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    setFileStructure(prev => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        let found = false;
        const next = nodes.map(node => {
          if (node.path === suggestion.path) {
            found = true;
            return { ...node, content: suggestion.data };
          }
          if (node.children) {
            const updatedChildren = updateNode(node.children);
            return { ...node, children: updatedChildren };
          }
          return node;
        });
        
        if (!found && !nodes.some(n => n.path === suggestion.path)) {
           return [...next, { id: Math.random().toString(36), name: suggestion.path.split('/').pop() || 'new_file', type: 'file', path: suggestion.path, content: suggestion.data }];
        }
        return next;
      };
      return updateNode(prev);
    });
    setLogs(prev => [...prev, `[Architect] Applied patch to ${suggestion.path}`]);
    setActiveTab('CODE');
  }, []);

  const handleAddNetNode = useCallback(async (description: string) => {
    setLogs(prev => [...prev, `[Architect] Synthesizing network node: ${description}`]);
    const nodeData = await architect.current.generateNetNode(description);
    if (nodeData) {
      const newNode = {
        ...nodeData,
        id: `node-${Date.now()}`,
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 300
      };
      setNetNodes(prev => [...prev, newNode]);
      setLogs(prev => [...prev, `[Architect] Node ${nodeData.name} integrated into graph.`]);
    }
  }, []);

  const handleNetGraphCodeGen = useCallback(async (nodeName: string, data: any) => {
    setLogs(prev => [...prev, `[Architect] Generating C++ implementation for ${nodeName}...`]);
    const task = `Implement a high-performance C++ networking handler or event for the following node definition: ${JSON.stringify(data)}`;
    const code = await architect.current.generateCode(task, "// Terraformer Network Layer Implementation");
    
    handleApplySuggestion({
      id: `net-gen-${Date.now()}`,
      type: 'create_file',
      label: `Net Implementation: ${nodeName}`,
      path: `/Source/Server/Net/${nodeName}.cpp`,
      data: code
    });
  }, [handleApplySuggestion]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim().toLowerCase();
    setLogs(prev => [...prev, `> terraform ${terminalInput}`, `[Shell] Executing command: ${cmd}...`]);
    
    if (cmd === 'clear') setLogs([]);
    else if (cmd.includes('compile')) setLogs(prev => [...prev, '[Compiler] Resolving dependencies...', '[Compiler] Building modules... OK']);
    else if (cmd.includes('status')) setLogs(prev => [...prev, '[System] Health: 100%', `[System] Profile: ${project.profile}`, `[System] Active Modals: ${activeTab}`]);
    else setLogs(prev => [...prev, `[Shell] Command not found: ${cmd}`]);
    
    setTerminalInput('');
  };

  const handleBuild = useCallback(async () => {
    setIsCompiling(true);
    setLogs(prev => [...prev, `[Build] Target: ${project.profile}`, project.language === 'RU' ? '[Build] Проверка совместимости ассетов...' : '[Build] Verifying Assets Compatibility...']);
    
    const flatFiles: any[] = [];
    const walk = (nodes: FileNode[]) => nodes.forEach(n => { flatFiles.push({name: n.name, path: n.path}); if (n.children) walk(n.children); });
    walk(fileStructure);

    const auditResults = await architect.current.conductCompatibilityAudit(flatFiles, project.profile);
    
    if (auditResults.length > 0) {
      setLogs(prev => [...prev, `[Audit] Found ${auditResults.length} platform-specific issues.`]);
      setProject(prev => ({ ...prev, issues: auditResults.map((iss: any) => ({ ...iss, id: Math.random().toString() })) }));
      setActiveTab('SCENE'); 
    } else {
      const buildId = Math.random().toString(36).substring(7).toUpperCase();
      setBuilds(prev => [{ id: buildId, platform: project.profile, date: new Date().toLocaleString(), status: 'SUCCESS' }, ...prev]);
      setLogs(prev => [...prev, `[Build] Audit PASSED.`, `[Build] SUCCESS: Build_${buildId} ready.`]);
    }
    setIsCompiling(false);
  }, [project.profile, fileStructure, project.language]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#010103] text-slate-300 font-['Inter']">
      {(showWizard || isSynthesizing) && (
        <ProjectWizard 
          language={project.language} 
          onScaffold={handleScaffold} 
          onClose={() => { setShowWizard(false); setIsSynthesizing(false); }} 
          forceLoading={isSynthesizing}
        />
      )}
      
      <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-10 bg-[#050508]/90 z-50">
        <div className="flex items-center space-x-10">
          <div className="flex flex-col cursor-pointer group" onClick={() => setShowWizard(true)}>
            <span className="font-black tracking-tighter text-white text-xl italic group-hover:text-emerald-400 transition-colors">TERRAFORMER</span>
            <span className="text-emerald-500 font-black text-[9px] tracking-widest uppercase">{t.statusReady} v1.1.0</span>
          </div>
          <select value={project.profile} onChange={(e) => setProject(prev => ({ ...prev, profile: e.target.value as ProjectProfile }))} className="bg-slate-900 text-[10px] border border-slate-800 rounded-lg px-4 py-2 font-black italic text-emerald-400 outline-none hover:border-emerald-500/50 transition-all cursor-pointer">
            <option value={ProjectProfile.PC_AAA}>PC_ULTIMATE (DX12_RT)</option>
            <option value={ProjectProfile.ANDROID_MID}>MOBILE_VULKAN (ASTC)</option>
            <option value={ProjectProfile.SERVER_DOCKER}>DOCKER_SWARM_NODE</option>
          </select>
          <div className="flex items-center space-x-3 ml-4">
             <span className="text-[9px] font-black text-slate-600 uppercase italic">Hybrid Mode:</span>
             <button onClick={() => setProject(p => ({...p, render2D: !p.render2D}))} className={`px-4 py-1 rounded-full text-[8px] font-black transition-all ${project.render2D ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                {project.render2D ? '2D_SPRITE' : '3D_MESH'}
             </button>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => setProject(p => ({...p, issues: []}))} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          <button onClick={toggleLanguage} className="px-4 py-2 text-[10px] font-black border border-slate-800 rounded-lg hover:bg-white/5 transition-all italic tracking-widest">{project.language}</button>
          <button onClick={handleBuild} disabled={isCompiling} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-2xl ${isCompiling ? 'bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 italic text-white'}`}>
            {isCompiling ? 'AUDITING...' : t.compileBuild}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <ProjectExplorer files={fileStructure} language={project.language} onFileSelect={(path) => {
            const find = (nodes: FileNode[]): FileNode | null => {
              for (const n of nodes) { if (n.path === path) return n; if (n.children) { const r = find(n.children); if (r) return r; } }
              return null;
            };
            const file = find(fileStructure);
            if (file) setActiveFile(file);
            setActiveTab('CODE');
        }} />

        <div className="flex-1 flex flex-col relative">
          <div className="h-14 border-b border-slate-800/40 bg-[#050508] flex items-center px-10 space-x-8">
            {(['SCENE', 'CODE', 'NETGRAPH', 'ASSETS', 'ORCHESTRATOR'] as WorkspaceTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-4 text-[9px] font-black italic tracking-[0.2em] transition-all relative uppercase ${activeTab === tab ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
                {t[`tab${tab.charAt(0) + tab.slice(1).toLowerCase()}` as keyof typeof t] || tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981]" />}
              </button>
            ))}
          </div>
          <div className="flex-1 relative bg-black">
             {activeTab === 'ORCHESTRATOR' ? (
                <div className="flex flex-col h-full">
                   <ServerOrchestrator language={project.language} />
                   {builds.length > 0 && (
                      <div className="h-48 border-t border-slate-800 bg-slate-950 p-6">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 italic">Build Gallery</h5>
                         <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                            {builds.map(b => (
                               <div key={b.id} className="min-w-[200px] bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col space-y-2 hover:border-emerald-500/30 transition-all cursor-pointer">
                                  <div className="flex justify-between items-center">
                                     <span className="text-white font-bold text-[11px]">BUILD_{b.id}</span>
                                     <span className="text-emerald-500 text-[8px] font-black">{b.status}</span>
                                  </div>
                                  <span className="text-slate-500 text-[9px]">{b.platform}</span>
                                  <span className="text-slate-600 text-[8px] italic">{b.date}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             ) : (
                <>
                   {activeTab === 'SCENE' && <Viewport3D profile={project.profile} render2D={project.render2D} complexity={projectComplexity} language={project.language} />}
                   {activeTab === 'NETGRAPH' && <NetGraph nodes={netNodes} onAddNode={handleAddNetNode} onGenerateCode={handleNetGraphCodeGen} language={project.language} />}
                   {activeTab === 'ASSETS' && <AssetStudio language={project.language} onImport={(name, type, analysis) => {
                      const node = { id: Math.random().toString(), name: `${name}.tfasset`, type: 'file' as const, path: `/Assets/${name}.tfasset`, content: JSON.stringify(analysis, null, 2) };
                      setFileStructure(prev => [...prev, node]);
                      setActiveFile(node);
                      setActiveTab('CODE');
                   }} />}
                   {activeTab === 'CODE' && (activeFile ? (
                      <div className="w-full h-full flex font-mono text-xs bg-[#010103]">
                         <div className="w-12 bg-slate-950 border-r border-slate-800/40 flex flex-col items-center py-6 text-slate-700 font-mono text-[9px] select-none">
                            {Array.from({length: Math.max(20, (activeFile.content?.split('\n').length || 0))}).map((_, i) => (
                              <div key={i} className="h-[21px] flex items-center">{i + 1}</div>
                            ))}
                         </div>
                         <div className="flex-1 flex flex-col">
                            <div className="h-10 bg-slate-950/40 border-b border-slate-800/20 flex items-center px-8 justify-between">
                               <div className="flex items-center space-x-4">
                                  <span className="text-emerald-500 font-black italic">{activeFile.name}</span>
                                  <span className="text-slate-700 text-[9px] uppercase tracking-widest">{activeFile.path}</span>
                               </div>
                            </div>
                            <textarea 
                              value={activeFile.content || ""} 
                              onChange={(e) => handleUpdateFileContent(e.target.value)} 
                              className="flex-1 p-6 bg-transparent text-slate-400 leading-[21px] font-mono text-[11px] outline-none resize-none scrollbar-hide focus:bg-white/[0.01] transition-colors" 
                              spellCheck={false} 
                            />
                         </div>
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30 h-full">
                        <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize source view</span>
                      </div>
                   ))}
                </>
             )}
          </div>
          
          <div className="h-56 border-t border-slate-800 bg-[#040407] flex flex-col">
            <div className="h-10 bg-slate-950 flex items-center px-10 justify-between border-b border-slate-900">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 animate-pulse" />
                  {t.kernelOutput}: Architect_Engine_V4
               </span>
               <div className="flex items-center space-x-6">
                  <span className="text-[8px] text-slate-700 font-mono italic">{t.complexity}: {projectComplexity} pts</span>
                  <span className="text-[8px] text-slate-700 font-mono italic">{t.threads}: {Math.min(128, Math.max(8, projectComplexity * 2))} Active</span>
               </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 bg-black/40 scrollbar-hide">
                  {logs.map((log, i) => (
                    <div key={i} className={`flex items-start ${log.includes('[Architect]') ? 'text-blue-400' : log.includes('[Build]') ? 'text-emerald-400' : log.startsWith('>') ? 'text-white font-bold' : 'text-slate-500'} italic`}>
                      <span className="text-slate-800 mr-4 tabular-nums">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                      <span className="flex-1 leading-relaxed">{log}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTerminalSubmit} className="h-10 bg-black border-t border-slate-900 flex items-center px-6">
                   <span className="text-emerald-500 font-black mr-4 select-none">terraformer @ system > </span>
                   <input 
                     value={terminalInput}
                     onChange={(e) => setTerminalInput(e.target.value)}
                     className="bg-transparent flex-1 text-[10px] font-mono outline-none text-slate-300"
                     placeholder="Enter command (clear, status, compile)..."
                   />
                </form>
            </div>
          </div>
        </div>

        <ArchitectPanel 
          language={project.language} 
          issues={project.issues} 
          activeFile={activeFile} 
          onApplySuggestion={handleApplySuggestion} 
          onDirectSynthesis={handleDirectSynthesis}
          context={`Workspace: ${activeTab}`} 
        />
      </main>
    </div>
  );
};

export default App;
