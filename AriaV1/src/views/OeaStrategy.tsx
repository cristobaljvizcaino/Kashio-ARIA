
import React, { useState, useMemo, useEffect } from 'react';
import { OEAS, OKRS, PORTFOLIO_2026 } from '../constants/constants';
import { 
  Target, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  Activity, 
  Users, 
  Briefcase, 
  LayoutGrid, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Zap,
  Box,
  ArrowRight,
  // Added missing imports to fix "Cannot find name" errors on lines 142 and 163
  User,
  Compass,
  Clock,
  Loader2
} from 'lucide-react';
import { Oea, Okr, PortfolioInitiative } from '../types/types';

const OeaStrategy: React.FC = () => {
  const [selectedOeaId, setSelectedOeaId] = useState<string | null>(null);
  const [selectedOkrId, setSelectedOkrId] = useState<string | null>(null);

  const selectedOea = useMemo(() => {
    return OEAS.find(o => o.id === selectedOeaId);
  }, [selectedOeaId]);

  const associatedOkrs = useMemo(() => {
    return OKRS.filter(o => o.oeaId === selectedOeaId);
  }, [selectedOeaId]);

  const selectedOkr = useMemo(() => {
    return OKRS.find(o => o.id === selectedOkrId);
  }, [selectedOkrId]);

  const associatedInitiatives = useMemo(() => {
    return PORTFOLIO_2026.filter(i => i.okrId === selectedOkrId);
  }, [selectedOkrId]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'At Risk': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getHealthDot = (health: string) => {
    switch (health) {
      case 'Healthy': return 'bg-emerald-500';
      case 'At Risk': return 'bg-amber-500';
      case 'Critical': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Strategy & Execution Hub</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Alineamiento de Objetivos Estratégicos Anuales (OEA) con resultados (OKR) e iniciativas PDLC.</p>
        </div>
        <div className="flex bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-x-8">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OEA Progress</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-[68%]"></div>
              </div>
              <span className="text-sm font-black text-indigo-600">68%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OKR Health</p>
            <div className="flex space-x-1.5 mt-1 justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Risks</p>
            <span className="text-sm font-black text-red-600 mt-1 block">⚠️ 3 Critical</span>
          </div>
        </div>
      </div>

      {/* Breadcrumbs Strategy */}
      {selectedOeaId && (
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
          <button onClick={() => { setSelectedOeaId(null); setSelectedOkrId(null); }} className="hover:text-indigo-600">Strategy Hub</button>
          <ChevronRight size={14} />
          <span className={`${!selectedOkrId ? 'text-indigo-600' : ''}`}>{selectedOea?.id}</span>
          {selectedOkrId && (
            <>
              <ChevronRight size={14} />
              <span className="text-indigo-600">{selectedOkr?.id}</span>
            </>
          )}
        </div>
      )}

      {/* Main Grid View */}
      {!selectedOeaId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OEAS.map(oea => (
              <button 
                key={oea.id}
                onClick={() => setSelectedOeaId(oea.id)}
                className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${getHealthColor(oea.health)}`}>
                    {oea.health}
                  </div>
                  <div className="flex space-x-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Zap key={star} size={12} className={star <= oea.impact ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{oea.id}</span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{oea.name}</h3>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Avance Estratégico</span>
                    <span className="text-slate-900 font-black">{oea.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${oea.progress}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                        <User size={12} className="text-indigo-600" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{oea.owner}</span>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Resumen de Completitud de Iniciativas */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center">
                  <LayoutGrid size={24} className="text-indigo-600 mr-3" />
                  Resumen de Completitud de Iniciativas
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Estado de avance de Gates por iniciativa en el portafolio</p>
              </div>
            </div>

            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <AlertCircle size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Funcionalidad de tracking disponible próximamente</p>
            </div>
          </div>
        </>
      ) : !selectedOkrId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* OEA Detail Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 text-indigo-500/10 scale-150">
                <Target size={160} />
              </div>
              <div className="relative space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl">
                    <Compass size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedOea?.id}</h2>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Objetivo Estratégico</p>
                  </div>
                </div>
                <p className="text-lg font-bold leading-tight text-slate-200">{selectedOea?.name}</p>
                <div className="space-y-3 pt-6 border-t border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Owner</span>
                    <span className="font-bold text-indigo-400">{selectedOea?.owner}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Periodo</span>
                    <span className="font-bold">{selectedOea?.period}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Impacto Negocio</span>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Zap key={s} size={12} className={s <= (selectedOea?.impact || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Iniciativas Activas</h4>
               <div className="space-y-3">
                 {PORTFOLIO_2026.filter(i => associatedOkrs.some(o => o.id === i.okrId)).slice(0, 3).map(i => (
                   <div key={i.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                     <span className="text-xs font-bold text-slate-700 truncate">{i.name}</span>
                   </div>
                 ))}
               </div>
               <button onClick={() => setSelectedOeaId(null)} className="w-full py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                 Volver al Hub Estratégico
               </button>
            </div>
          </div>

          {/* OKR List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center">
              <TrendingUp size={24} className="mr-3 text-indigo-600" />
              Resultados Clave (OKRs)
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {associatedOkrs.map(okr => (
                <button 
                  key={okr.id}
                  onClick={() => setSelectedOkrId(okr.id)}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getHealthColor(okr.health)}`}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{okr.id}</span>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{okr.name}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">Owner: {okr.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto KRs</p>
                      <div className="flex space-x-1">
                        {okr.keyResults.map(kr => (
                          <div key={kr.id} className={`w-2 h-2 rounded-full ${kr.current >= kr.target ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                        ))}
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
              {associatedOkrs.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 italic">No hay OKRs vinculados a este OEA aún.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Detail for OKR and KRs */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedOkr?.id}</span>
                  <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${getHealthColor(selectedOkr?.health || '')}`}>
                    {selectedOkr?.health}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4">{selectedOkr?.name}</h3>
                <div className="space-y-2 pb-6 border-b border-slate-100">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Owner Ejecutivo</p>
                   <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">
                        {selectedOkr?.owner.charAt(0)}
                     </div>
                     <span className="text-sm font-black text-slate-700">{selectedOkr?.owner}</span>
                   </div>
                </div>

                <div className="mt-6 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Target size={14} className="mr-2" /> Key Results Breakdown
                  </h4>
                  {selectedOkr?.keyResults.map(kr => (
                    <div key={kr.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-slate-700 leading-tight pr-4">{kr.description}</p>
                        <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{kr.current}{kr.unit} / {kr.target}{kr.unit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${kr.current >= kr.target ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                          style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedOkrId(null)} className="w-full mt-10 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 border border-slate-100 rounded-xl transition-all">
                  Volver a OKRs de {selectedOea?.id}
                </button>
              </div>
           </div>

           {/* Linked Initiatives */}
           <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 flex items-center">
                  <Box size={24} className="text-indigo-600 mr-3" />
                  Iniciativas que impactan este OKR
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{associatedInitiatives.length} PDLC Active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {associatedInitiatives.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.id}</span>
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mt-0.5">{item.name}</h4>
                      </div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-tighter">
                        {item.portfolio}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PDLC Gate</p>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black">G2 Discovery</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Squad / Lead</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{item.squads} • {item.lead}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center space-x-2">
                         <Activity size={12} className="text-emerald-500" />
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Alineado al KR</span>
                       </div>
                       <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                         <ChevronRight size={18} />
                       </button>
                    </div>
                  </div>
                ))}
                {associatedInitiatives.length === 0 && (
                  <div className="col-span-2 py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                    <AlertCircle size={40} className="text-slate-300" />
                    <div className="space-y-1">
                      <p className="text-slate-600 font-black">Sin iniciativas vinculadas</p>
                      <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">No se han asignado iniciativas de portafolio para movilizar este OKR específico.</p>
                    </div>
                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">Vincular Iniciativa</button>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OeaStrategy;
