
import React, { useState, useEffect, useMemo } from 'react';
import { ServerInstance, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ServerOrchestratorProps {
  language: Language;
}

export const ServerOrchestrator: React.FC<ServerOrchestratorProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [yamlConfig, setYamlConfig] = useState(`cluster:
  - name: "login-srv-01"
    type: "auth"
    instances: 2
    language: "go"
    load: 12
  - name: "world-zone-north"
    type: "world"
    instances: 3
    language: "python"
    capacity: 1000
    load: 45
  - name: "proxy-balancer"
    type: "proxy"
    instances: 1
    load: 8`);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);

  const servers = useMemo<ServerInstance[]>(() => {
    try {
      const serverBlocks = yamlConfig.split('- name:').slice(1);
      return serverBlocks.map((block, idx) => {
        const name = block.split('\n')[0].replace(/"/g, '').trim();
        const typeMatch = block.match(/type:\s*"?(\w+)"?/);
        const loadMatch = block.match(/load:\s*(\d+)/);
        const type = (typeMatch ? typeMatch[1] : 'unknown') as any;
        const load = loadMatch ? parseInt(loadMatch[1]) : 0;
        
        return {
          id: `srv-${idx}`,
          name: name || `Instance-${idx}`,
          type: type,
          status: isDeploying ? 'deploying' : 'running',
          load: isDeploying ? 0 : load,
          logs: [`[${type}] Initialized via spec`, `[${type}] Runtime: Production`]
        };
      });
    } catch (e) {
      return [];
    }
  }, [yamlConfig, isDeploying]);

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeployProgress(0);
    const interval = setInterval(() => {
        setDeployProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setIsDeploying(false);
                return 100;
            }
            return prev + 10;
        });
    }, 300);
  };

  const handleExportCloud = () => {
    const blob = new Blob([`# Terraform Export for Terraformer Studio\n# Generated: ${new Date().toISOString()}\n\nprovider "aws" {\n  region = "us-east-1"\n}\n\n${yamlConfig}`], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloud_deployment_aws.tf';
    a.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-slate-800 flex flex-col relative">
          <div className="h-10 bg-slate-900/50 flex items-center px-4 border-b border-slate-800 justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{t.specYaml}</span>
            <button onClick={handleExportCloud} className="text-[8px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors border border-blue-500/30 px-2 py-1 rounded">
               {t.exportCloud}
            </button>
          </div>
          <textarea
            value={yamlConfig}
            onChange={(e) => setYamlConfig(e.target.value)}
            className="flex-1 bg-slate-950 p-6 font-mono text-xs text-blue-300 outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
          <div className="absolute bottom-6 right-6">
             <button 
               onClick={handleDeploy}
               disabled={isDeploying}
               className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl ${isDeploying ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'}`}
             >
                {isDeploying ? t.provisioning : t.deployCluster}
             </button>
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-[#050508] relative">
          {isDeploying && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-12">
                  <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-3xl">
                      <div className="flex justify-between items-end mb-4">
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest italic">{t.provisioning}</h5>
                          <span className="text-[10px] text-blue-400 font-mono">{deployProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" style={{ width: `${deployProgress}%` }} />
                      </div>
                  </div>
              </div>
          )}

          <div className="h-10 bg-slate-900/50 flex items-center px-4 border-b border-slate-800 justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{t.infrastructure}</span>
            <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse italic">{t.realtimeStream}</span>
          </div>
          
          <div className="flex-1 p-6 grid grid-cols-2 gap-5 auto-rows-min overflow-y-auto scrollbar-hide">
            {servers.map(srv => (
              <div key={srv.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col space-y-4 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h4 className="text-[12px] font-black text-white italic">{srv.name}</h4>
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 bg-black px-1.5 py-0.5 rounded">{srv.type} layer</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isDeploying ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                    <span className="text-slate-600 uppercase">{t.nodeLoad}</span>
                    <span className="text-slate-400">{srv.load}%</span>
                  </div>
                  <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${srv.load}%` }} />
                  </div>
                </div>

                <div className="font-mono text-[7px] text-slate-600 bg-black/30 p-2 rounded">
                    {srv.logs?.map((l, i) => <div key={i} className="truncate tracking-tighter">{l}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
