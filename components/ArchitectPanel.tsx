
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Language, AISuggestion, DiagnosticIssue, FileNode } from '../types';
import { ArchitectService } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';

interface ArchitectPanelProps {
  language: Language;
  context: string;
  issues: DiagnosticIssue[];
  activeFile: FileNode | null;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onDirectSynthesis?: (prompt: string) => void;
}

export const ArchitectPanel: React.FC<ArchitectPanelProps> = ({ language, context, issues, activeFile, onApplySuggestion, onDirectSynthesis }) => {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: t.sysNominal, 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'ISSUES'>('CHAT');
  const scrollRef = useRef<HTMLDivElement>(null);
  const architect = useRef(new ArchitectService());
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const decodeAudio = async (base64: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert raw PCM to buffer
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const base64Audio = await architect.current.synthesizeSpeech(text, language);
    if (base64Audio) {
      const buffer = await decodeAudio(base64Audio);
      if (audioContextRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }
    } else {
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const currentInput = input;
    const userMsg: Message = { role: 'user', content: currentInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const rawResponse = await architect.current.generateResponse(currentInput, context, language);
    
    // Logic to detect if the user wants to "build" a game
    const buildKeywords = ['сделай игру', 'создай проект', 'make a game', 'build project', 'создай игру', 'build game'];
    const wantsToBuild = buildKeywords.some(kw => currentInput.toLowerCase().includes(kw));

    const responseMsg: Message = { role: 'assistant', content: rawResponse, timestamp: Date.now() };
    
    if (wantsToBuild) {
      responseMsg.suggestions = [{
        id: 'direct-synth',
        type: 'batch_setup',
        label: language === 'RU' ? 'Запустить полный синтез проекта' : 'Initiate Full Project Synthesis',
        path: '/',
        data: currentInput
      }];
    }

    setMessages(prev => [...prev, responseMsg]);
    setIsTyping(false);
  };

  const handleApplyIssueFix = async (issue: DiagnosticIssue) => {
    setIsSearching(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSearching(false);
    
    onApplySuggestion({ 
      id: 'fix-'+issue.id, 
      type: 'fix_issue', 
      label: t.autoPatch, 
      path: issue.file, 
      data: issue.suggestion 
    });
  };

  const handleContextAction = async (action: any) => {
    if (!activeFile && action.type !== 'batch_setup') return;
    
    if (action.type === 'batch_setup' && onDirectSynthesis) {
      onDirectSynthesis(action.data);
      return;
    }

    setIsTyping(true);
    const generatedCode = await architect.current.generateCode(
      action.label,
      activeFile?.content || `// File: ${activeFile?.name}`
    );

    onApplySuggestion({
      id: action.id,
      type: action.type as any,
      label: action.label,
      path: activeFile?.path || '/',
      data: generatedCode
    });
    
    setIsTyping(false);
  };

  const contextActions = useMemo(() => {
    if (!activeFile) return [];
    const name = activeFile.name.toLowerCase();
    if (name.endsWith('.cpp') || name.endsWith('.hpp')) {
        return [
            { id: 'opt-mem', label: language === 'RU' ? 'Оптимизация Памяти' : 'Optimize Memory Path', type: 'optimize', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'gen-unit', label: language === 'RU' ? 'Создать Unit-тест' : 'Generate Unit Test', type: 'create_file', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
        ];
    }
    if (name.endsWith('.tfasset') || name.endsWith('.fbx')) {
        return [
            { id: 'gen-lod', label: language === 'RU' ? 'Создать LOD Группы' : 'Generate LOD Groups', type: 'optimize', icon: 'M4 6h16M4 12h16M4 18h16' },
            { id: 'rebake', label: language === 'RU' ? 'Перезапечь PBR' : 'Rebake PBR Maps', type: 'modify_config', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }
        ];
    }
    return [];
  }, [activeFile, language]);

  return (
    <div className="flex flex-col h-full bg-[#070b14] border-l border-slate-800/60 w-80 shadow-2xl z-40">
      <div className="flex bg-slate-900/40 border-b border-slate-800/40">
          <button onClick={() => setActiveTab('CHAT')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all italic ${activeTab === 'CHAT' ? 'text-emerald-400 bg-emerald-400/5 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>{t.architect}</button>
          <button onClick={() => setActiveTab('ISSUES')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all relative italic ${activeTab === 'ISSUES' ? 'text-amber-400 bg-amber-400/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>{t.diagnostics}{issues.length > 0 && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping" />}</button>
      </div>

      {activeTab === 'CHAT' && activeFile && (
          <div className="p-4 bg-blue-500/5 border-b border-blue-500/10">
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest italic flex items-center mb-3">
                <svg className="w-3 h-3 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {t.proactiveContext}: {activeFile.name}
              </span>
              <div className="flex flex-wrap gap-2">
                  {contextActions.map(action => (
                      <button 
                        key={action.id}
                        onClick={() => handleContextAction(action)}
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-black text-slate-400 hover:text-white hover:border-blue-500/50 transition-all flex items-center group uppercase tracking-tighter"
                      >
                          <svg className="w-2.5 h-2.5 mr-1.5 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={action.icon} /></svg>
                          {action.label}
                      </button>
                  ))}
              </div>
          </div>
      )}
      
      {activeTab === 'CHAT' ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-xs scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[95%] p-4 rounded-2xl border relative group ${m.role === 'user' ? 'bg-blue-600/10 border-blue-500/20 text-blue-100' : 'bg-slate-900/60 border-slate-800/40 text-slate-300'}`}>
                  {m.role === 'assistant' && (
                    <button 
                      onClick={() => handleSpeak(m.content)}
                      className={`absolute -right-2 -top-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center flex transition-all opacity-0 group-hover:opacity-100 hover:border-emerald-500 ${isSpeaking ? 'animate-pulse bg-emerald-900/20 text-emerald-500 border-emerald-500' : 'text-slate-500'}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    </button>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed text-[11px]">{m.content}</div>
                  
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      {m.suggestions.map(s => (
                        <button 
                          key={s.id}
                          onClick={() => handleContextAction(s)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center space-x-2 animate-bounce"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-[9px] text-emerald-500 animate-pulse italic">{t.thinking}</div>}
          </div>

          <div className="p-4 border-t border-slate-800">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={t.aiPrompt}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500/50 h-24 font-mono"
            />
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isSearching && (
            <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-pulse">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
               <span className="text-[9px] font-black text-blue-400 uppercase italic">{t.searchingWeb}</span>
            </div>
          )}
          {issues.map(issue => (
            <div key={issue.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded italic ${issue.severity === 'error' ? 'bg-red-500' : 'bg-amber-500 text-black'}`}>{issue.severity}</span>
                <span className="text-[9px] text-slate-600">{issue.file.split('/').pop()}</span>
              </div>
              <p className="text-[10px] text-slate-300 italic mb-3">"{issue.message}"</p>
              <button onClick={() => handleApplyIssueFix(issue)} className="w-full text-[9px] font-black bg-emerald-600 py-2 rounded-lg uppercase transition-all active:scale-95">{t.autoPatch}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
