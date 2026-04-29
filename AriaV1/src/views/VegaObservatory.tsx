
import React, { useState, useMemo, useEffect } from 'react';
import { VEGA_INCIDENTS, VEGA_IMPACTS, PRODUCT_HEALTH, VEGA_RAILS, VEGA_ADOPTION_DATA } from '../constants/constants';
import { 
  Activity, 
  AlertTriangle, 
  AlertCircle,
  ShieldAlert, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  Globe, 
  Zap, 
  MessageSquare, 
  Ticket, 
  ExternalLink,
  BarChart3,
  ArrowUpRight,
  Loader2, 
  Sparkles,
  Info,
  Coins,
  ShieldCheck,
  Server,
  Filter,
  Monitor,
  Terminal,
  FileSearch,
  Database,
  Cpu,
  Layers,
  ArrowLeftRight,
  TrendingDown,
  Building2,
  Wifi,
  Workflow,
  MapPin,
  Landmark,
  Download,
  Box,
  Component,
  ZapOff,
  Rocket
} from 'lucide-react';
import { VegaIncident, VegaImpact, ProductHealthMetric, VegaRail, AdoptionMetric } from '../types/types';
import { chatWithAria } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie } from 'recharts';

const VegaObservatory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'health' | 'rails' | 'adoption'>('incidents');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(VEGA_INCIDENTS[0].id);
  const [selectedRailId, setSelectedRailId] = useState<string>(VEGA_RAILS[0].id);
  
  // Advanced Filters
  const [filterTerritory, setFilterTerritory] = useState<string>('All');
  const [filterPartner, setFilterPartner] = useState<string>('All');
  const [filterRailType, setFilterRailType] = useState<string>('All');
  const [filterSlaStatus, setFilterSlaStatus] = useState<string>('All');

  // Pulse Live & Adoption Filters
  const [filterProduct, setFilterProduct] = useState<string>('All');
  const [filterComponent, setFilterComponent] = useState<string>('All');
  const [filterTier, setFilterTier] = useState<string>('All');
  
  const [isKaiaLoading, setIsKaiaLoading] = useState(false);
  const [kaiaResponse, setKaiaResponse] = useState<string | null>(null);

  const territories = ['All', 'PE', 'MX', 'CO', 'CL', 'BR', 'Regional'];
  const railTypes = ['All', 'Transferencias', 'Depósitos', 'Batch', 'QR', 'API/Webhook'];
  const slaStatuses = ['All', 'OK', 'Risk', 'Breach'];
  const tiers = ['All', 'T0', 'T1', 'T2', 'T3', 'T4'];

  // Pulse Unique values
  const uniqueProducts = useMemo(() => ['All', ...Array.from(new Set(VEGA_INCIDENTS.map(i => i.product))).sort()], []);
  const uniquePlatforms = useMemo(() => ['All', ...Array.from(new Set(VEGA_INCIDENTS.map(i => i.platform))).sort()], []);

  // Reset partner filter when territory changes
  useEffect(() => {
    setFilterPartner('All');
  }, [filterTerritory]);

  const availablePartnersForTerritory = useMemo(() => {
    const rails = VEGA_RAILS.filter(r => filterTerritory === 'All' || r.country === filterTerritory);
    const partners = Array.from(new Set(rails.map(r => r.partner)));
    return ['All', ...partners.sort()];
  }, [filterTerritory]);

  const filteredIncidents = useMemo(() => {
    return VEGA_INCIDENTS.filter(inc => {
      const terrMatch = filterTerritory === 'All' || inc.country === filterTerritory;
      const prodMatch = filterProduct === 'All' || inc.product === filterProduct;
      const platMatch = filterComponent === 'All' || inc.platform === filterComponent;
      return terrMatch && prodMatch && platMatch;
    });
  }, [filterTerritory, filterProduct, filterComponent]);

  const filteredRails = useMemo(() => {
    return VEGA_RAILS.filter(rail => {
      const territoryMatch = filterTerritory === 'All' || rail.country === filterTerritory;
      const partnerMatch = filterPartner === 'All' || rail.partner === filterPartner;
      const typeMatch = filterRailType === 'All' || rail.railType === filterRailType;
      const statusMatch = filterSlaStatus === 'All' || rail.status === filterSlaStatus;
      return territoryMatch && partnerMatch && typeMatch && statusMatch;
    });
  }, [filterTerritory, filterPartner, filterRailType, filterSlaStatus]);

  const selectedIncident = useMemo(() => 
    VEGA_INCIDENTS.find(i => i.id === selectedIncidentId) || VEGA_INCIDENTS[0]
  , [selectedIncidentId]);

  const selectedImpact = useMemo(() => 
    VEGA_IMPACTS.find(i => i.incidentId === selectedIncidentId)
  , [selectedIncidentId]);

  const selectedRail = useMemo(() => 
    VEGA_RAILS.find(r => r.id === selectedRailId) || VEGA_RAILS[0]
  , [selectedRailId]);

  const trendData = [
    { name: 'Lun', psd: 0.12, dsn: 0.08, latency: 450, success: 98.4, adoption: 40 },
    { name: 'Mar', psd: 0.15, dsn: 0.09, latency: 480, success: 98.1, adoption: 42 },
    { name: 'Mie', psd: 0.42, dsn: 0.28, latency: 1200, success: 94.2, adoption: 45 },
    { name: 'Jue', psd: 0.18, dsn: 0.12, latency: 600, success: 97.5, adoption: 48 },
    { name: 'Vie', psd: 0.11, dsn: 0.07, latency: 420, success: 98.9, adoption: 55 },
    { name: 'Sab', psd: 0.08, dsn: 0.04, latency: 400, success: 99.2, adoption: 58 },
    { name: 'Dom', psd: 0.07, dsn: 0.03, latency: 380, success: 99.8, adoption: 60 },
  ];

  const handleKaiaContext = async (contextType: 'incident' | 'health' | 'rail' | 'growth') => {
    setIsKaiaLoading(true);
    let prompt = '';
    
    if (contextType === 'incident') {
      prompt = `Actúa como KAIA (Kashio AI Agent). Analiza este incidente operativo: 
      ID: ${selectedIncident.id} | Plataforma: ${selectedIncident.platform} | País: ${selectedIncident.country} | Evento: ${selectedIncident.eventType} | Afectación: ${selectedIncident.affectation}
      Responde con REPORTE ECONOMICO, PLAN TÉCNICO y ESTRATEGIA DE COMUNICACIÓN.`;
    } else if (contextType === 'rail') {
      prompt = `Actúa como KAIA. Analiza el comportamiento del riel ${selectedRail.railType} de ${selectedRail.partner} (${selectedRail.country} - ${selectedRail.region}):
      Status: ${selectedRail.status} | Success Rate: ${selectedRail.successRate}% | Latencia: ${selectedRail.avgLatencyMs}ms
      Sugiere activación de contingencia y pasos para Banking Ops.`;
    } else if (contextType === 'growth') {
      prompt = `Actúa como KAIA Growth Ops. Analiza el gap de adopción de módulos Kashio.
      Datos: Recaudo (35% util), Payouts (25% util). 
      El TTA (Time to Activate) promedio es de 7.2 días.
      Sugiere 3 campañas de growth, 1 acción de CS preventivo por churn de baja adopción y proyecta revenue incremental.`;
    } else {
      const health = PRODUCT_HEALTH[0];
      prompt = `Actúa como KAIA. Analiza la salud del producto ${health.productName}.`;
    }
    
    const response = await chatWithAria(prompt);
    setKaiaResponse(response || 'No se pudo generar el análisis.');
    setIsKaiaLoading(false);
  };

  const getSlaColor = (status: string) => {
    switch (status) {
      case 'OK': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Risk': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'Breach': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const getAdoptionColor = (status: string) => {
    switch (status) {
      case 'High': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const renderFormattedResponse = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**')) {
        const title = line.replace(/\*\*/g, '');
        return (
          <div key={i} className="flex items-center space-x-2 mt-4 mb-2 first:mt-0">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{title}</span>
          </div>
        );
      }
      return line.trim() ? (
        <p key={i} className="text-xs text-slate-300 leading-relaxed mb-1 ml-6 last:mb-0">
          {line.replace(/^- /, '• ')}
        </p>
      ) : null;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Bar: Navigation & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm gap-8">
        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
           <button onClick={() => {setActiveTab('incidents'); setKaiaResponse(null);}} className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'incidents' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
             <Activity size={14} /><span>Pulse Live</span>
           </button>
           <button onClick={() => {setActiveTab('rails'); setKaiaResponse(null);}} className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'rails' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
             <Wifi size={14} /><span>Rieles & Partners</span>
           </button>
           <button onClick={() => {setActiveTab('adoption'); setKaiaResponse(null);}} className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'adoption' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
             <Rocket size={14} /><span>Adopción & Crecimiento</span>
           </button>
           <button onClick={() => {setActiveTab('health'); setKaiaResponse(null);}} className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'health' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
             <Monitor size={14} /><span>Salud Producto</span>
           </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100 w-full lg:w-auto">
              <div className="px-3 text-slate-400 flex items-center space-x-2">
                 <Filter size={14} />
                 <span className="text-[10px] font-black uppercase whitespace-nowrap">Observatory Filters</span>
              </div>
              <div className="flex flex-wrap gap-1 p-1 bg-white rounded-xl shadow-inner border border-slate-100 flex-1">
                <div className="relative group">
                  <MapPin size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500" />
                  <select 
                    value={filterTerritory} 
                    onChange={(e) => setFilterTerritory(e.target.value)} 
                    className="bg-transparent pl-7 pr-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer appearance-none min-w-[110px]"
                  >
                    {territories.map(t => <option key={t} value={t}>{t === 'All' ? 'País: Todos' : `País: ${t}`}</option>)}
                  </select>
                </div>
                
                <div className="h-4 w-px bg-slate-100 my-auto"></div>
                <div className="relative group">
                  <Users size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500" />
                  <select 
                    value={filterTier} 
                    onChange={(e) => setFilterTier(e.target.value)} 
                    className="bg-transparent pl-7 pr-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer appearance-none min-w-[110px]"
                  >
                    {tiers.map(t => <option key={t} value={t}>{t === 'All' ? 'Tier: Todos' : t}</option>)}
                  </select>
                </div>

                {activeTab === 'incidents' && (
                  <>
                    <div className="h-4 w-px bg-slate-100 my-auto"></div>
                    <div className="relative group">
                      <Box size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500" />
                      <select 
                        value={filterProduct} 
                        onChange={(e) => setFilterProduct(e.target.value)} 
                        className="bg-transparent pl-7 pr-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer appearance-none min-w-[120px]"
                      >
                        {uniqueProducts.map(p => <option key={p} value={p}>{p === 'All' ? 'Producto: Todos' : p}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
           </div>
        </div>
      </div>

      {activeTab === 'adoption' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8">
           {/* Panel A: Adopción por Módulo */}
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div>
                    <h3 className="text-xl font-black text-slate-900">Panel A — Adopción por Módulo</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status de Habilitación vs Uso Real</p>
                 </div>
                 <div className="flex space-x-3">
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">84% ACTIVACIÓN GLOBAL</span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-5">Módulo</th>
                          <th className="px-8 py-5">Clientes Habilitados</th>
                          <th className="px-8 py-5">Clientes Activos</th>
                          <th className="px-8 py-5">% Adopción</th>
                          <th className="px-8 py-5">Potencial Growth</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {VEGA_ADOPTION_DATA.map(row => (
                         <tr key={row.moduleId} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getAdoptionColor(row.status)}`}>
                                     <Box size={16} />
                                  </div>
                                  <span className="font-black text-slate-900">{row.moduleName}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 font-bold text-slate-600">{row.enabledClients}</td>
                            <td className="px-8 py-6 font-bold text-slate-900">{row.activeClients}</td>
                            <td className="px-8 py-6">
                               <div className="flex items-center space-x-3">
                                  <span className="font-black text-slate-700">{row.adoptionRate}%</span>
                                  <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                     <div className={`h-full ${row.adoptionRate > 70 ? 'bg-emerald-500' : row.adoptionRate > 40 ? 'bg-amber-400' : 'bg-indigo-500'}`} style={{width: `${row.adoptionRate}%`}}></div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${getAdoptionColor(row.status)}`}>
                                  {row.status === 'High' ? 'ALTA' : row.status === 'Medium' ? 'MEDIA' : 'BAJA'}
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Panels B & C: TTA & Utilization */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Panel B — TTA & Activación</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Time to Activate (Median Days)</p>
                    </div>
                    <Clock size={24} className="text-slate-300" />
                 </div>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={VEGA_ADOPTION_DATA} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="moduleName" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} width={100} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey="ttaDays" radius={[0, 4, 4, 0]} barSize={20}>
                             {VEGA_ADOPTION_DATA.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.ttaDays < 5 ? '#10b981' : entry.ttaDays < 10 ? '#f59e0b' : '#6366f1'} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                       💡 TTA crítico detectado en <strong>Cobranza</strong>. La activación demora 12.4 días, sugiriendo fricción en la integración inicial.
                    </p>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Panel C — Potencial vs Uso Actual</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tx Volumen Utilization %</p>
                    </div>
                    <ArrowUpRight size={24} className="text-slate-300" />
                 </div>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendData}>
                          <defs>
                             <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                               <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip />
                          <Area type="monotone" dataKey="adoption" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUtil)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Utilización Avg</p>
                       <p className="text-xl font-black text-slate-900">37.2%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Upsell Gap</p>
                       <p className="text-xl font-black text-emerald-600">$132K <span className="text-[10px]">USD/Mo</span></p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Panel D: Gap de Crecimiento & Proyección */}
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingUp size={240} />
              </div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-5 space-y-8">
                    <div>
                       <h3 className="text-2xl font-black">Panel D — Gap de Crecimiento</h3>
                       <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Análisis de Upside Regional 2026</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Gap Absoluto</p>
                          <p className="text-4xl font-black text-white">2.8M <span className="text-sm text-slate-500">Tx/Mo</span></p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Gap Relativo</p>
                          <p className="text-4xl font-black text-indigo-400">62.8%</p>
                       </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                       <div className="flex items-center space-x-3 mb-4">
                          <Coins size={20} className="text-amber-400" />
                          <p className="text-xs font-black uppercase tracking-widest text-amber-400">Revenue No Capturado</p>
                       </div>
                       <p className="text-3xl font-black">$1.58M <span className="text-xs font-bold text-slate-500">USD ANUAL</span></p>
                       <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">Basado en clientes Tier T1/T2 con integración parcial en <strong>Recaudo</strong> y <strong>Payouts</strong>.</p>
                    </div>
                 </div>
                 
                 {/* KAIA Panel E */}
                 <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col relative group/kaia">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                             <Sparkles size={20} className="text-white" />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-white leading-none">Panel E — Acciones KAIA</h4>
                             <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mt-1 tracking-tighter">Growth Ops Context Engine</p>
                          </div>
                       </div>
                       <div className="px-2 py-1 bg-white/10 rounded text-[9px] font-black uppercase tracking-widest">v2.4 PROACTIVE</div>
                    </div>

                    {!kaiaResponse ? (
                      <div className="flex-1 space-y-6">
                        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl italic text-sm text-slate-400 leading-relaxed">
                           "Analizando el comportamiento de los módulos habilitados vs usados... Detecto un gap del 65% en <strong>Recaudo</strong>. Cruzo datos de TTA (4.8d) contra Benchmark regional para sugerir acciones tácticas."
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/5">
                              <Zap size={14} className="text-amber-400 mt-1" />
                              <div>
                                 <p className="text-[10px] font-black text-white uppercase">Campaña Cross-sell</p>
                                 <p className="text-[9px] text-slate-500">Módulos no activos en T1/T2</p>
                              </div>
                           </div>
                           <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/5">
                              <ShieldAlert size={14} className="text-red-400 mt-1" />
                              <div>
                                 <p className="text-[10px] font-black text-white uppercase">Prevención Churn</p>
                                 <p className="text-[9px] text-slate-500">Baja utilización en Cobranza</p>
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => handleKaiaContext('growth')}
                           disabled={isKaiaLoading}
                           className="w-full mt-auto py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center space-x-3"
                        >
                           {isKaiaLoading ? <Loader2 size={24} className="animate-spin" /> : <Terminal size={24} />}
                           <span className="text-base uppercase tracking-tighter">SOLICITAR GROWTH INSIGHTS</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col space-y-6 animate-in fade-in zoom-in-95">
                         <div className="flex-1 bg-slate-900 shadow-inner rounded-2xl p-6 overflow-y-auto max-h-[300px] no-scrollbar">
                            {renderFormattedResponse(kaiaResponse)}
                         </div>
                         <div className="grid grid-cols-3 gap-3">
                            <button className="py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 transition-all">Ejecutar Campaña</button>
                            <button className="py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">Asignar Ticket CS</button>
                            <button onClick={() => setKaiaResponse(null)} className="py-3 bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-600 transition-all">Nuevo Análisis</button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Panel A: Incidentes */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xl font-black text-slate-900 px-2 flex items-center">
              <Activity size={24} className="mr-3 text-indigo-600" />Pulse Stream Live
            </h3>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
              {filteredIncidents.map(incident => (
                <button 
                  key={incident.id}
                  onClick={() => { setSelectedIncidentId(incident.id); setKaiaResponse(null); }}
                  className={`w-full text-left bg-white p-6 rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                    selectedIncidentId === incident.id ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-50' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    incident.severity === 'Critical' ? 'bg-red-500' : incident.severity === 'Major' ? 'bg-amber-500' : 'bg-indigo-400'
                  }`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                         <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-full">{incident.country}</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{incident.id}</span>
                         <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{incident.eventType}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{incident.service}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{incident.product} • {incident.platform}</p>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest shadow-sm ${
                         incident.pulseStatus === 'Investigando' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                         incident.pulseStatus === 'Mitigando' ? 'text-indigo-600 bg-indigo-50 border-indigo-100 animate-pulse' :
                         'text-emerald-600 bg-emerald-50 border-emerald-100'
                       }`}>{incident.pulseStatus}</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grado de Afectación</p>
                     <p className="text-xs font-bold text-slate-700">{incident.affectation}</p>
                     <div className="mt-2 flex items-center space-x-2">
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                           <div className={`h-full ${
                             incident.affectation.includes('Caída total') ? 'w-full bg-red-500' :
                             incident.affectation.includes('Indisponibilidad parcial') ? 'w-2/3 bg-amber-500' :
                             'w-1/3 bg-indigo-500'
                           }`}></div>
                        </div>
                        <span className="text-[9px] font-black text-slate-400">IMPACT LVL</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center space-x-4">
                       <div className="flex items-center text-[10px] font-black text-slate-500 uppercase">
                          <Users size={12} className="mr-1" /> {incident.clientsImpacted} Clientes
                       </div>
                       <div className="flex items-center text-[10px] font-black text-slate-500 uppercase">
                          <Clock size={12} className="mr-1" /> {incident.durationMinutes}m
                       </div>
                    </div>
                    <div className="flex items-center text-[10px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform">
                      EXPLORE <ChevronRight size={14} />
                    </div>
                  </div>
                </button>
              ))}
              {filteredIncidents.length === 0 && (
                <div className="bg-slate-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                   <ShieldCheck size={40} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin incidentes con los filtros seleccionados</p>
                </div>
              )}
            </div>
          </div>

          {/* Impact Analysis Area */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden sticky top-8">
               <div className="bg-slate-900 p-8 text-white relative">
                 <Sparkles size={120} className="absolute right-0 top-0 opacity-5 text-indigo-500" />
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Context</span>
                       <h3 className="text-3xl font-black">{selectedIncident.service}</h3>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/5 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Afectación Estimada</p>
                       <p className="text-xl font-black text-red-400">{selectedImpact?.estimatedGmv}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-colors">
                       <p className="text-[11px] font-black text-indigo-300 uppercase mb-2 flex items-center">
                          <Coins size={14} className="mr-1.5" /> Kashio Loss (Fees + Penalties)
                       </p>
                       <h4 className="text-4xl font-black">${selectedImpact?.kashioLoss.toLocaleString()}<span className="text-sm text-slate-400 ml-1 font-bold">USD</span></h4>
                       <p className="text-[10px] text-slate-500 font-bold mt-2 italic">{selectedImpact?.lossExplanation}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-colors">
                       <p className="text-[11px] font-black text-amber-300 uppercase mb-2 flex items-center">
                          <ShieldAlert size={14} className="mr-1.5" /> Client Loss (GMV Risk)
                       </p>
                       <h4 className="text-4xl font-black">${selectedImpact?.clientLoss.toLocaleString()}<span className="text-sm text-slate-400 ml-1 font-bold">USD</span></h4>
                       <p className="text-[10px] text-slate-500 font-bold mt-2 italic">Basado en volumen {selectedIncident.country}</p>
                    </div>
                 </div>

                 <div className="mt-8 grid grid-cols-5 gap-4">
                    {Object.entries(selectedIncident.tierImpact).map(([tier, count]) => (
                       <div key={tier} className={`p-3 rounded-2xl border text-center transition-all ${(count as number) > 0 ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-white/5 border-white/5 opacity-40'}`}>
                          <p className="text-[9px] font-black text-indigo-300 uppercase mb-1">{tier.toUpperCase()}</p>
                          <p className="text-base font-black text-white">{count}</p>
                       </div>
                    ))}
                 </div>
               </div>

               <div className="p-8 bg-slate-900/95 border-t border-white/5">
                  {!kaiaResponse && (
                    <div className="space-y-4">
                       <div className="p-5 bg-white/5 border border-white/10 rounded-2xl mb-4">
                          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                             <Sparkles size={16} />
                             <span className="text-[11px] font-black uppercase tracking-widest">KAIA Executive Summary</span>
                          </div>
                          <p className="text-xs text-slate-400 italic">"Analizaré el evento de tipo <strong>{selectedIncident.eventType}</strong> ocurrido a las <strong>{selectedIncident.startTime}</strong>. Cruzaré el impacto de los <strong>{selectedIncident.clientsImpacted}</strong> clientes contra el playbook de contingencia de <strong>{selectedIncident.product}</strong>."</p>
                       </div>
                       <button 
                         onClick={() => handleKaiaContext('incident')} 
                         disabled={isKaiaLoading} 
                         className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center space-x-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                       >
                         {isKaiaLoading ? <Loader2 size={24} className="animate-spin" /> : <Terminal size={24} />}
                         <span className="text-base">SOLICITAR REPORTE ESTRATÉGICO KAIA</span>
                       </button>
                    </div>
                  )}
                  {kaiaResponse && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                       <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] overflow-y-auto max-h-[400px] no-scrollbar shadow-inner">
                          {renderFormattedResponse(kaiaResponse)}
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <button className="flex items-center justify-center space-x-2 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase transition-all hover:bg-white/20 border border-white/5">
                             <Download size={14} /><span>Descargar PDF</span>
                          </button>
                          <button onClick={() => setKaiaResponse(null)} className="flex items-center justify-center space-x-2 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase transition-all hover:bg-indigo-500">
                             <ArrowLeftRight size={14} /><span>Nuevo Análisis</span>
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rails' && (
        <div className="space-y-8 animate-in slide-in-from-right-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRails.map(rail => (
                <button 
                  key={rail.id}
                  onClick={() => { setSelectedRailId(rail.id); setKaiaResponse(null); }}
                  className={`bg-white p-6 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${
                    selectedRailId === rail.id ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-50 scale-[1.02]' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-xl ${rail.status === 'OK' ? 'bg-emerald-50 text-emerald-600' : rail.status === 'Breach' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                       <Building2 size={20} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getSlaColor(rail.status)}`}>{rail.status}</span>
                      <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{rail.country} - {rail.id}</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1 leading-tight">{rail.partner} — {rail.railType}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rail.region}</p>
                  
                  <div className="mt-6 flex items-end justify-between border-t border-slate-50 pt-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Success Rate</p>
                        <p className={`text-lg font-black ${rail.successRate < 95 ? 'text-red-500' : 'text-slate-800'}`}>{rail.successRate}%</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Latencia</p>
                        <p className="text-lg font-black text-slate-800">{rail.avgLatencyMs}ms</p>
                     </div>
                  </div>
                </button>
              ))}
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-4">
                       <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-100">
                          <Workflow size={28} />
                       </div>
                       <div>
                          <div className="flex items-center space-x-2 mb-1">
                             <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-tighter">{selectedRail.country} MARKET</span>
                             <span className="text-slate-300">•</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GATE: G4 PRODUCTION</span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">{selectedRail.partner} — {selectedRail.service}</h3>
                       </div>
                    </div>
                 </div>
                 <div className="p-8 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="latency" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-10 -top-10 text-indigo-500/10 group-hover:text-indigo-500/20 transition-all duration-700 scale-150">
                    <Landmark size={160} />
                 </div>
                 <div className="relative space-y-6 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black flex items-center">
                          <Sparkles size={20} className="text-indigo-400 mr-2" />KAIA Insights
                       </h3>
                    </div>
                    {!kaiaResponse ? (
                      <div className="flex-1 flex flex-col">
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl mb-6">
                           <p className="text-xs text-slate-400 italic leading-relaxed">
                            "Analizaré la estabilidad de <strong>{selectedRail.partner}</strong> en el territorio de <strong>{selectedRail.country}</strong>."
                           </p>
                        </div>
                        <button onClick={() => handleKaiaContext('rail')} disabled={isKaiaLoading} className="w-full mt-auto py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95">
                           {isKaiaLoading ? <Loader2 size={20} className="animate-spin" /> : <Workflow size={20} />}
                           <span>INICIAR ANÁLISIS KAIA</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in flex-1 flex flex-col">
                         <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl overflow-y-auto max-h-[350px] no-scrollbar">
                           {renderFormattedResponse(kaiaResponse)}
                         </div>
                         <button onClick={() => setKaiaResponse(null)} className="w-full text-center text-[10px] font-bold text-slate-500 uppercase mt-4 hover:text-slate-300 transition-colors">Analizar nuevo riel</button>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-8 animate-in slide-in-from-left-8 duration-500">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Salud Operativa del Catálogo</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Métricas G5 Post-Release por Producto</p>
                </div>
             </div>
             
             {PRODUCT_HEALTH.map(health => (
               <div key={health.productId} className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-slate-100 pt-8 first:border-0 first:pt-0">
                  <div className="space-y-2">
                     <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{health.productId}</span>
                     <h4 className="text-xl font-black text-slate-900">{health.productName}</h4>
                  </div>
                  
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PSD Rate</p>
                     <div className="flex items-center space-x-3">
                        <span className="text-2xl font-black text-slate-900">{health.psdRate}%</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${health.psdRate > 0.5 ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{width: `${Math.min(100, health.psdRate * 10)}%`}}></div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DSN Rate</p>
                     <div className="flex items-center space-x-3">
                        <span className="text-2xl font-black text-slate-900">{health.dsnRate}%</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${health.dsnRate > 0.5 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{width: `${Math.min(100, health.dsnRate * 10)}%`}}></div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recon Match</p>
                     <div className="flex items-center space-x-3">
                        <span className="text-2xl font-black text-slate-900">{health.reconMatching}%</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{width: `${health.reconMatching}%`}}></div>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VegaObservatory;
