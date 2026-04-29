
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  History, 
  ChevronRight, 
  Target, 
  Sparkles,
  LayoutGrid,
  Scale, 
  Loader2,
  Terminal,
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Clock,
  PieChart,
  User,
  Workflow,
  Download,
  AlertCircle,
  Box,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Filter,
  Layers,
  Search,
  Plus,
  Minus,
  RotateCcw,
  Play,
  XCircle,
  Share2,
  Link2,
  ShieldX,
  Flame,
  ArrowLeftRight
} from 'lucide-react';
import { SQUAD_HEALTH_DATA, OEAS, OKRS, PORTFOLIO_2026, GOVERNANCE_LOG, DEPENDENCY_MAP } from '../constants/constants';
import { SquadHealth, Okr, Oea, PortfolioInitiative } from '../types/types';
import { chatWithAria } from '../services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart, 
  Area,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

const SquadGovernance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scorecard' | 'squads' | 'risks' | 'capacity' | 'log'>('overview');
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [selectedOeaFilter, setSelectedOeaFilter] = useState<string>('All');
  const [isKaiaLoading, setIsKaiaLoading] = useState(false);
  const [kaiaResponse, setKaiaResponse] = useState<string | null>(null);

  // Capacity Simulator State
  const [fteAdjustments, setFteAdjustments] = useState<Record<string, number>>({});
  const [disabledInitiatives, setDisabledInitiatives] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedSquad = useMemo(() => 
    SQUAD_HEALTH_DATA.find(s => s.id === selectedSquadId)
  , [selectedSquadId]);

  const handleKaiaDecision = async () => {
    setIsKaiaLoading(true);
    const prompt = `Actúa como KAIA Governance Agent. 
    Analiza la sobrecarga actual del Squad 4 (145%) y el Squad Product AI (130%). 
    Sugiere una redistribución de carga (Load Swapping) para no impactar el OEA-03 (Expansión Regional). 
    Considera congelar IDPRD-026 (Ecuador) y IDPRD-027 (Panamá).`;
    
    const response = await chatWithAria(prompt);
    setKaiaResponse(response || 'No se pudo generar la recomendación.');
    setIsKaiaLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Warning': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'At Risk': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'Blocked': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const simulatedCapacityData = useMemo(() => {
    return SQUAD_HEALTH_DATA.map(squad => {
      let currentLoad = squad.load;
      const adjustment = fteAdjustments[squad.id] || 0;
      const capacityMultiplier = 1 + (adjustment * 0.2);
      const squadInits = PORTFOLIO_2026.filter(i => squad.activeInitiatives.includes(i.id));
      const disabledCount = squadInits.filter(i => disabledInitiatives.includes(i.id)).length;
      const loadReduction = disabledCount * 15;
      const projectedLoad = Math.round((currentLoad - loadReduction) / capacityMultiplier);
      return {
        ...squad,
        projectedLoad: Math.max(0, projectedLoad),
        isOverloaded: projectedLoad > 110,
        isHealthy: projectedLoad >= 70 && projectedLoad <= 95
      };
    });
  }, [fteAdjustments, disabledInitiatives]);

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* OEA Scorecard Semáforo */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center">
          <Target size={24} className="mr-3 text-indigo-600" /> Executive Scorecard OEA (Q1 2026)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {OEAS.map(oea => (
            <div key={oea.id} className="p-4 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:border-indigo-200 transition-all cursor-help">
               <div className={`w-3 h-3 rounded-full mb-3 ${oea.health === 'Healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : oea.health === 'At Risk' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-red-500'}`}></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{oea.id}</span>
               <p className="text-[11px] font-bold text-slate-700 leading-tight h-10 overflow-hidden line-clamp-2">{oea.name}</p>
               <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                  <span className="text-lg font-black text-slate-900">{oea.progress}%</span>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <AlertTriangle size={180} />
              </div>
              <div className="relative z-10 space-y-6">
                 <h3 className="text-xl font-black flex items-center">
                    <ShieldCheck size={24} className="text-indigo-400 mr-3" /> Governance Alerts
                 </h3>
                 <div className="space-y-4">
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-start space-x-3">
                       <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                       <p className="text-xs font-bold leading-relaxed">SQ4 overloaded (145%). Potential breach on 3 regional riels.</p>
                    </div>
                    <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-start space-x-3">
                       <Workflow size={18} className="text-amber-400 shrink-0 mt-0.5" />
                       <p className="text-xs font-bold leading-relaxed">Reconciliation blocked by DataBridge (SQ AI dependency).</p>
                    </div>
                 </div>
                 <button onClick={() => setActiveTab('log')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Review Decisions</button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-xl font-black text-slate-900">Squad Capacity vs Demand</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Squad Workload Balance (Current Sprints)</p>
              </div>
              <Scale size={24} className="text-slate-300" />
           </div>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={SQUAD_HEALTH_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="load" radius={[8, 8, 0, 0]} barSize={40}>
                       {SQUAD_HEALTH_DATA.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.load > 120 ? '#ef4444' : entry.load > 100 ? '#f59e0b' : '#6366f1'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );

  const renderScorecard = () => {
    const filteredOkrs = selectedOeaFilter === 'All' 
      ? OKRS 
      : OKRS.filter(o => o.oeaId === selectedOeaFilter);

    return (
      <div className="space-y-8 animate-in slide-in-from-left-8 duration-500">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 leading-tight">Vista de Valor Ganado</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alineamiento de Estrategia ↔ Ejecución</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="relative group">
                <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500" />
                <select 
                  value={selectedOeaFilter}
                  onChange={(e) => setSelectedOeaFilter(e.target.value)}
                  className="pl-10 pr-6 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">Todos los OEAs</option>
                  {OEAS.map(o => <option key={o.id} value={o.id}>{o.id}: {o.name.substring(0, 30)}...</option>)}
                </select>
             </div>
             <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                <Download size={18} />
             </button>
          </div>
        </div>

        <div className="space-y-12">
          {OEAS.filter(oea => selectedOeaFilter === 'All' || oea.id === selectedOeaFilter).map(oea => {
            const okrsForOea = OKRS.filter(okr => okr.oeaId === oea.id);
            return (
              <div key={oea.id} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">{oea.id}</span>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{oea.name}</h4>
                  </div>
                  <div className="flex items-center space-x-6">
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Global Progress</p>
                        <p className="text-lg font-black text-indigo-600 leading-none">{oea.progress}%</p>
                     </div>
                     <div className={`w-3 h-3 rounded-full ${oea.health === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {okrsForOea.map(okr => (
                     <div key={okr.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all p-8 group">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                           <div className="lg:col-span-5 space-y-6">
                              <div className="flex items-start justify-between">
                                 <div className="space-y-1">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{okr.id} — Objective</span>
                                    <h5 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{okr.name}</h5>
                                 </div>
                                 <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${okr.health === 'Healthy' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                                    {okr.health}
                                 </span>
                              </div>

                              <div className="space-y-4">
                                 {okr.keyResults.map(kr => (
                                   <div key={kr.id} className="space-y-2">
                                      <div className="flex justify-between items-end">
                                         <p className="text-[11px] font-bold text-slate-600 leading-tight pr-8">{kr.description}</p>
                                         <div className="text-right shrink-0">
                                            <span className="text-xs font-black text-slate-900">{kr.current}{kr.unit}</span>
                                            <span className="text-[9px] font-bold text-slate-400 ml-1">/ {kr.target}{kr.unit}</span>
                                         </div>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div 
                                           className={`h-full transition-all duration-1000 ${okr.health === 'Healthy' ? 'bg-emerald-500' : okr.health === 'At Risk' ? 'bg-amber-400' : 'bg-red-500'}`} 
                                           style={{width: `${Math.min(100, (kr.current / kr.target) * 100)}%`}}
                                         ></div>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                              <div className="flex items-center justify-between mb-4">
                                 <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Layers size={14} className="mr-2 text-indigo-400" /> Iniciativas que Contribuyen
                                 </h6>
                                 <span className="text-[10px] font-bold text-slate-400 italic">Total: {PORTFOLIO_2026.filter(i => i.okrIds.includes(okr.id)).length}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                                 {PORTFOLIO_2026.filter(i => i.okrIds.includes(okr.id)).map(init => (
                                   <div key={init.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group/init relative">
                                      <div className="flex justify-between items-start mb-1.5">
                                         <span className="text-[9px] font-black text-indigo-500 uppercase">{init.id}</span>
                                         <span className="text-[8px] font-black text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100 uppercase">{init.pdlcGate}</span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-1">{init.name}</p>
                                      <div className="flex items-center justify-between mt-3">
                                         <div className="flex -space-x-1">
                                            {init.squads.split(',').map(s => (
                                              <div key={s} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[7px] font-black text-slate-400 uppercase" title={s}>{s.trim().charAt(0)}{s.trim().slice(-1)}</div>
                                            ))}
                                         </div>
                                         <button className="p-1 text-slate-300 group-hover/init:text-indigo-600 transition-colors">
                                            <ArrowUpRight size={14} />
                                         </button>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSquads = () => (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
       <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
             <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                <tr>
                   <th className="px-8 py-5">Squad Name</th>
                   <th className="px-8 py-5">Load / Capacity</th>
                   <th className="px-8 py-5">Run vs Change</th>
                   <th className="px-8 py-5">Risk Profile</th>
                   <th className="px-8 py-5">Active IDPRDs</th>
                   <th className="px-8 py-5 text-right">Action</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {SQUAD_HEALTH_DATA.map(squad => (
                  <tr key={squad.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${getStatusColor(squad.status)}`}>
                              <Users size={20} />
                           </div>
                           <div>
                              <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{squad.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{squad.status}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="space-y-2">
                           <div className="flex justify-between items-end">
                              <span className={`text-[11px] font-black ${squad.load > 100 ? 'text-red-600' : 'text-slate-700'}`}>{squad.load}%</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Load</span>
                           </div>
                           <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${squad.load > 120 ? 'bg-red-500' : squad.load > 100 ? 'bg-amber-400' : 'bg-indigo-500'}`} style={{width: `${Math.min(100, squad.load)}%`}}></div>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center space-x-1 w-32 h-2 rounded-full overflow-hidden bg-slate-100">
                           <div className="h-full bg-slate-400" style={{width: `${squad.run}%`}} title="Run"></div>
                           <div className="h-full bg-emerald-500" style={{width: `${squad.change}%`}} title="Change"></div>
                        </div>
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mt-1">
                           <span>Run {squad.run}%</span>
                           <span>Change {squad.change}%</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                          squad.risk === 'Critical' ? 'text-red-600 bg-red-50 border-red-100' :
                          squad.risk === 'High' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                          'text-slate-500 bg-slate-50 border-slate-100'
                        }`}>{squad.risk}</span>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex -space-x-2">
                           {squad.activeInitiatives.slice(0, 3).map(id => (
                             <div key={id} className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[8px] font-black text-indigo-600 shadow-sm" title={id}>{id.split('-')[1]}</div>
                           ))}
                           {squad.activeInitiatives.length > 3 && (
                             <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-[8px] font-black text-white">+ {squad.activeInitiatives.length - 3}</div>
                           )}
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <button onClick={() => setSelectedSquadId(squad.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><ChevronRight size={18} /></button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderRisks = () => {
    // Calculamos el riesgo por iniciativa para la matriz de calor
    const heatMapData = PORTFOLIO_2026.map(init => ({
      name: init.name,
      id: init.id,
      impact: init.priorityScore || 5, // Impacto basado en score de prioridad
      probability: (init.mainRisk?.length || 0) % 10 || 5, // Simulación de probabilidad basada en complejidad del riesgo
      portfolio: init.portfolio
    }));

    const handleMitigationKaia = async () => {
      setIsKaiaLoading(true);
      const prompt = `Analiza los riesgos críticos del portafolio 2026. 
      Especialmente enfócate en los bloqueos del ${DEPENDENCY_MAP.map(d => `${d.source}->${d.target} (${d.type})`).join(', ')}.
      Genera una matriz de mitigación de 4 cuadrantes para el CDPO.`;
      const response = await chatWithAria(prompt);
      setKaiaResponse(response);
      setIsKaiaLoading(false);
    };

    return (
      <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Matriz de Calor ARIA */}
          <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-2xl font-black text-slate-900">Matriz de Riesgo Sistémico</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Impacto vs. Probabilidad (Calculado por ARIA)</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <Target size={24} />
                </div>
             </div>
             
             <div className="h-[450px] relative">
                {/* Labels de la Matriz */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-black text-slate-300 uppercase py-10 -ml-6">
                   <span className="rotate-[-90deg]">Crítico</span>
                   <span className="rotate-[-90deg]">Alto</span>
                   <span className="rotate-[-90deg]">Medio</span>
                   <span className="rotate-[-90deg]">Bajo</span>
                </div>
                
                <ResponsiveContainer width="100%" height="100%">
                   <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="impact" name="Impacto" domain={[0, 11]} hide />
                      <YAxis type="number" dataKey="probability" name="Probabilidad" domain={[0, 11]} hide />
                      <ZAxis type="number" range={[100, 1000]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{data.id}</p>
                                <p className="text-sm font-bold text-slate-900">{data.name}</p>
                                <div className="flex gap-4 pt-2">
                                   <div className="text-[9px] font-black text-slate-400 uppercase">Impacto: <span className="text-slate-900">{data.impact}</span></div>
                                   <div className="text-[9px] font-black text-slate-400 uppercase">Probabilidad: <span className="text-slate-900">{data.probability}</span></div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Iniciativas" data={heatMapData}>
                         {heatMapData.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`} 
                             fill={entry.impact > 8 && entry.probability > 7 ? '#ef4444' : entry.impact > 6 ? '#f59e0b' : '#6366f1'} 
                             strokeWidth={entry.impact > 9 ? 8 : 0}
                             stroke={entry.impact > 9 ? 'rgba(239, 68, 68, 0.2)' : 'none'}
                           />
                         ))}
                      </Scatter>
                   </ScatterChart>
                </ResponsiveContainer>

                <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-black text-slate-300 uppercase px-20 -mb-6">
                   <span>Baja Probabilidad</span>
                   <span>Alta Probabilidad</span>
                </div>
             </div>
          </div>

          {/* Panel de Mitigación KAIA */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden h-full flex flex-col">
                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                   <ShieldAlert size={260} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center space-x-3 mb-8">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Sparkles size={28} /></div>
                      <h3 className="text-xl font-black italic">Risk Mitigation</h3>
                   </div>
                   
                   {!kaiaResponse ? (
                     <div className="flex-1 flex flex-col">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl mb-8">
                           <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                              "Detecto 3 bloqueos críticos entre Squads de Rieles y Conciliación. Solicita el plan de mitigación para liberar el G3 de México y Colombia."
                           </p>
                        </div>
                        
                        <div className="space-y-4 mb-10">
                           <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                              <Flame size={18} className="text-red-400" />
                              <span className="text-[10px] font-black uppercase text-red-100">3 Bloqueos Críticos</span>
                           </div>
                           <div className="flex items-center space-x-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                              <Workflow size={18} className="text-indigo-400" />
                              <span className="text-[10px] font-black uppercase text-indigo-100">8 Dependencias Activas</span>
                           </div>
                        </div>

                        <button 
                           onClick={handleMitigationKaia}
                           disabled={isKaiaLoading}
                           className="w-full mt-auto py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center space-x-3 active:scale-95"
                        >
                           {isKaiaLoading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                           <span>Generar Plan Mitigación</span>
                        </button>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[400px] no-scrollbar mb-6">
                           <div className="prose prose-invert prose-sm">
                              {kaiaResponse.split('\n').map((line, i) => (
                                <p key={i} className="text-slate-300 text-xs leading-relaxed mb-4">{line}</p>
                              ))}
                           </div>
                        </div>
                        <button onClick={() => setKaiaResponse(null)} className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Nueva Simulación</button>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Mapa de Dependencias Cruzadas */}
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                 <h3 className="text-2xl font-black text-slate-900">Visualizador de Dependencias Cruzadas</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Squad Governance Matrix (Blockers & Risks)</p>
              </div>
              <button className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">
                 <Link2 size={16} /><span>Auditar Grafo</span>
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10">
              {DEPENDENCY_MAP.map((dep, idx) => (
                <div key={idx} className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all hover:shadow-xl ${
                  dep.type === 'Blocker' ? 'bg-red-50 border-red-100' : 
                  dep.type === 'Risk' ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'
                }`}>
                   <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl ${
                        dep.type === 'Blocker' ? 'bg-red-100 text-red-600' : 
                        dep.type === 'Risk' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                         <ShieldX size={24} />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                        dep.type === 'Blocker' ? 'text-red-700 border-red-200 bg-red-100' : 
                        dep.type === 'Risk' ? 'text-amber-700 border-amber-200 bg-amber-100' : 'text-indigo-700 border-indigo-200 bg-indigo-100'
                      }`}>{dep.type}</span>
                   </div>
                   
                   <div className="flex items-center justify-between mb-6">
                      <div className="text-center flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase">Origen</p>
                         <p className="text-lg font-black text-slate-900">{dep.source}</p>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 mx-4" />
                      <div className="text-center flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase">Afectado</p>
                         <p className="text-lg font-black text-slate-900">{dep.target}</p>
                      </div>
                   </div>

                   <p className="text-xs font-bold text-slate-600 leading-relaxed bg-white/50 p-4 rounded-2xl border border-white">
                      "{dep.description}"
                   </p>

                   <div className="mt-6 flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase">SLA Impact: <span className="text-red-500">-4d</span></span>
                      <button className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Ver Tarea Relacionada</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const renderLog = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <div>
                <h3 className="text-xl font-black text-slate-900">VEGA Governance Log</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Single Source of Truth for Decisions</p>
             </div>
             <button className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">
                <Download size={14} /><span>Export Log</span>
             </button>
          </div>
          <table className="w-full text-sm text-left border-collapse">
             <thead className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                <tr>
                   <th className="px-8 py-5">Date / Event</th>
                   <th className="px-8 py-5">Scope / Entity</th>
                   <th className="px-8 py-5">Decision & Outcome</th>
                   <th className="px-8 py-5">Governance Owner</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {GOVERNANCE_LOG.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                           <div className={`p-2 rounded-xl ${log.severity === 'Critical' ? 'bg-red-50 text-red-600' : log.severity === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              <History size={18} />
                           </div>
                           <div>
                              <div className="font-black text-slate-900 leading-none">{log.date}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">{log.id}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center space-x-2">
                           <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                              {log.initiativeId || log.squadId}
                           </span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="max-w-md">
                           <p className="text-sm font-black text-slate-800 leading-tight mb-1">{log.decision}</p>
                           <p className="text-xs text-slate-500 font-medium">{log.reason}</p>
                        </div>
                     </td>
                     <td className="px-8 py-6 font-black text-slate-700 text-xs">
                        <div className="flex items-center space-x-2">
                           <User size={14} className="text-slate-400" />
                           <span>{log.owner}</span>
                        </div>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderCapacity = () => {
    const handleFteChange = (squadId: string, delta: number) => {
      setFteAdjustments(prev => ({
        ...prev,
        [squadId]: (prev[squadId] || 0) + delta
      }));
    };

    const toggleProject = (projectId: string) => {
      setDisabledInitiatives(prev => 
        prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
      );
    };

    const handleRunSimulation = async () => {
      setIsSimulating(true);
      const scenario = simulatedCapacityData
        .filter(s => s.load !== s.projectedLoad || fteAdjustments[s.id])
        .map(s => `${s.name}: ${s.load}% -> ${s.projectedLoad}% (FTEs adj: ${fteAdjustments[s.id] || 0})`)
        .join(', ');
      
      const prompt = `Actúa como KAIA Capacity Planner. Analiza esta simulación de carga para el Q2 2026:
      Cambios: ${scenario}.
      Iniciativas deshabilitadas: ${disabledInitiatives.join(', ')}.
      ¿Es este plan resiliente? ¿Permite el cumplimiento del OEA de Expansión Regional? Responde en 4 puntos breves.`;
      
      const response = await chatWithAria(prompt);
      setKaiaResponse(response);
      setIsSimulating(false);
    };

    return (
      <div className="space-y-8 animate-in slide-in-from-top-8 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                 <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg">
                    <Scale size={20} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900">What-if Simulator</h3>
              </div>

              <div className="space-y-8">
                {/* FTE Adjustments */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Users size={14} className="mr-2" /> Resource Allocation (FTEs)
                  </h4>
                  <div className="space-y-3">
                    {SQUAD_HEALTH_DATA.map(squad => (
                      <div key={squad.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{squad.name}</span>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleFteChange(squad.id, -1)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Minus size={16} /></button>
                          <span className={`text-xs font-black w-6 text-center ${fteAdjustments[squad.id] > 0 ? 'text-indigo-600' : fteAdjustments[squad.id] < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {fteAdjustments[squad.id] > 0 ? '+' : ''}{fteAdjustments[squad.id] || 0}
                          </span>
                          <button onClick={() => handleFteChange(squad.id, 1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"><Plus size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Projects Toggles */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Zap size={14} className="mr-2" /> Critical Projects (Kill-Switch)
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {PORTFOLIO_2026.filter(i => (i.priorityScore || 0) > 9).map(init => (
                      <button 
                        key={init.id}
                        onClick={() => toggleProject(init.id)}
                        className={`text-left p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                          disabledInitiatives.includes(init.id) 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{init.name}</span>
                          {disabledInitiatives.includes(init.id) ? <XCircle size={14} /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                   <button 
                     onClick={() => {setFteAdjustments({}); setDisabledInitiatives([]); setKaiaResponse(null);}}
                     className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                   >
                     <RotateCcw size={20} />
                   </button>
                   <button 
                     onClick={handleRunSimulation}
                     disabled={isSimulating}
                     className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
                   >
                     {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                     <span>Run simulation</span>
                   </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Projected Load for Q2 2026</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparing Current vs Simulated Capacity</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                       <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Q1 Real</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Q2 Simulated</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  {simulatedCapacityData.map(squad => (
                    <div key={squad.id} className="space-y-2">
                       <div className="flex justify-between items-end">
                          <div>
                            <span className="text-sm font-black text-slate-800">{squad.name}</span>
                            <span className="ml-2 text-[9px] font-bold text-slate-400">({squad.id})</span>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-bold text-slate-400 uppercase mr-3">Current: {squad.load}%</span>
                             <span className={`text-sm font-black ${squad.projectedLoad > 110 ? 'text-red-600' : squad.projectedLoad < 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                               New Load: {squad.projectedLoad}%
                             </span>
                          </div>
                       </div>
                       <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden relative">
                          <div className="absolute left-0 top-0 h-full bg-slate-200/50" style={{ width: `${squad.load}%` }}></div>
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              squad.projectedLoad > 110 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 
                              squad.projectedLoad < 70 ? 'bg-amber-400' : 
                              'bg-indigo-600'
                            }`} 
                            style={{ width: `${Math.min(100, squad.projectedLoad)}%` }}
                          ></div>
                          <div className="absolute left-[100%] top-0 h-full w-px bg-slate-300"></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {kaiaResponse && (
               <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                  <div className="absolute right-0 top-0 p-10 opacity-5">
                    <Sparkles size={240} />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row gap-10">
                    <div className="md:w-1/3 space-y-6">
                       <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center"><Terminal size={24} /></div>
                          <h3 className="text-xl font-black italic">KAIA Review</h3>
                       </div>
                       <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-indigo-400 uppercase">Risk Level</p>
                             <p className="text-lg font-black">{simulatedCapacityData.some(s => s.projectedLoad > 110) ? '🔴 CRITICAL' : '🟢 STABLE'}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-indigo-400 uppercase">Execution Velocity</p>
                             <p className="text-lg font-black">~12.4 Story Pts/Sprint</p>
                          </div>
                       </div>
                    </div>
                    <div className="md:w-2/3">
                       <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] overflow-y-auto max-h-[300px] no-scrollbar">
                          <div className="prose prose-invert prose-sm max-w-none">
                             {kaiaResponse.split('\n').map((line, i) => (
                               <p key={i} className="text-slate-200 leading-relaxed mb-4">{line}</p>
                             ))}
                          </div>
                       </div>
                       <div className="mt-8 flex justify-end space-x-4">
                          <button className="px-6 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/20">Discard Scenario</button>
                          <button className="px-6 py-3 bg-indigo-600 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-500/20">Commit to Roadmap</button>
                       </div>
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Squad Governance & Observability</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Sistema de control dinámico: Valor entregado, capacidad y riesgos sistémicos.</p>
        </div>
        <div className="flex items-center space-x-4">
           {!kaiaResponse ? (
             <button 
               onClick={handleKaiaDecision}
               disabled={isKaiaLoading}
               className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all scale-105 active:scale-95"
             >
               {isKaiaLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
               <span>KAIA Governance Assistant</span>
             </button>
           ) : (
             <button onClick={() => setKaiaResponse(null)} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Clear Decision Map</button>
           )}
        </div>
      </div>

      {kaiaResponse && activeTab !== 'capacity' && activeTab !== 'risks' && (
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
           <div className="absolute right-0 top-0 p-10 opacity-5">
              <Zap size={300} />
           </div>
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-6">
                 <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Terminal size={28} /></div>
                    <h3 className="text-2xl font-black italic">ARIA Decisions</h3>
                 </div>
                 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Decision Rule Set</p>
                    <div className="space-y-3">
                       <div className="flex items-center space-x-2 text-xs font-bold text-slate-300"><CheckCircle2 size={14} className="text-emerald-500" /><span>OEA alignment priority</span></div>
                       <div className="flex items-center space-x-2 text-xs font-bold text-slate-300"><CheckCircle2 size={14} className="text-emerald-500" /><span>Capacity threshold 110%</span></div>
                       <div className="flex items-center space-x-2 text-xs font-bold text-slate-300"><CheckCircle2 size={14} className="text-emerald-500" /><span>Risk mitigation cost</span></div>
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                 <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] overflow-y-auto max-h-[400px] no-scrollbar shadow-inner">
                    <div className="prose prose-invert prose-sm max-w-none">
                       {kaiaResponse.split('\n').map((line, i) => (
                         <p key={i} className="text-slate-200 leading-relaxed mb-4">{line}</p>
                       ))}
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <button className="py-4 bg-emerald-600 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">Apply Swap Decision</button>
                    <button className="py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/20 transition-all border border-white/5">Escalate to Committee</button>
                    <button className="py-4 bg-red-600 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 transition-all shadow-lg shadow-red-900/20">Reject Recommendation</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex space-x-8 border-b border-slate-200 pb-px">
         {[
           { id: 'overview', label: 'Dashboard Ejecutivo', icon: Activity },
           { id: 'scorecard', label: 'Scorecard 360', icon: BarChart3 },
           { id: 'squads', label: 'Estado de Squads', icon: Users },
           { id: 'risks', label: 'Mapa de Riesgos', icon: Workflow },
           { id: 'capacity', label: 'Capacity Planning', icon: Scale },
           { id: 'log', label: 'Decision Log', icon: History },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => {setActiveTab(tab.id as any); setKaiaResponse(null);}}
             className={`pb-4 text-xs font-bold uppercase tracking-widest flex items-center space-x-2 transition-all relative ${
               activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             <tab.icon size={16} />
             <span>{tab.label}</span>
             {activeTab === tab.id && (
               <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>
             )}
           </button>
         ))}
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'scorecard' && renderScorecard()}
        {activeTab === 'squads' && renderSquads()}
        {activeTab === 'risks' && renderRisks()}
        {activeTab === 'capacity' && renderCapacity()}
        {activeTab === 'log' && renderLog()}
      </div>
    </div>
  );
};

export default SquadGovernance;
