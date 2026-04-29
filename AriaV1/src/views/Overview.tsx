
import React, { useState, useMemo, useEffect } from 'react';
import Timeline from '../components/Timeline';
import { GATES } from '../constants/constants';
import { Gate, ChatMessage } from '../types/types';
import { Sparkles, Send, Loader2, Target, Search, ChevronDown, FileText, CheckCircle2, Clock, CalendarDays, Activity, Layers, BarChart3, AlertCircle } from 'lucide-react';
import { chatWithAria } from '../services/geminiService';
import { getAllInitiatives } from '../services/databaseService';
import { getArtifactDefinitionsForInitiative } from '../services/artifactDefinitionService';
import type { Initiative, ArtifactStatus } from '../types/types';

interface OverviewProps {
  onGateClick: (gate: Gate) => void;
  onInitiativeChange?: (initiative: any) => void;
}

const Overview: React.FC<OverviewProps> = ({ onGateClick, onInitiativeChange }) => {
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoadingInitiatives, setIsLoadingInitiatives] = useState(true);
  const [totalDefinitions, setTotalDefinitions] = useState(0);

  useEffect(() => {
    loadInitiatives();
  }, []);

  useEffect(() => {
    if (selectedInitiative) {
      loadDefinitionsCount(selectedInitiative);
    }
  }, [selectedInitiative]);

  const loadInitiatives = async () => {
    try {
      const data = await getAllInitiatives();
      setInitiatives(data);
    } catch (error) {
      console.error('Error loading initiatives:', error);
    } finally {
      setIsLoadingInitiatives(false);
    }
  };

  const loadDefinitionsCount = async (init: Initiative) => {
    try {
      const defs = await getArtifactDefinitionsForInitiative(init.type || 'Change');
      setTotalDefinitions(defs.length);
    } catch {
      setTotalDefinitions(0);
    }
  };

  const filteredSelectorInitiatives = useMemo(() => {
    return initiatives.filter(i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.product?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initiatives, searchQuery]);

  const initiativesByGate = useMemo(() => {
    const grouped: Record<string, Initiative[]> = {};
    GATES.forEach(g => { grouped[g.id] = []; });
    initiatives.forEach(init => {
      const gate = init.currentGateId || 'G0';
      if (grouped[gate]) grouped[gate].push(init);
    });
    return grouped;
  }, [initiatives]);

  // Stats for selected initiative
  const selectedStats = useMemo(() => {
    if (!selectedInitiative) return null;

    const arts = selectedInitiative.artifacts || [];
    const generated = arts.filter(a => a.status === 'ACTIVE' as ArtifactStatus).length;
    const drafts = arts.filter(a => a.status === 'DRAFT' as ArtifactStatus).length;
    const totalVersions = arts.reduce((sum, a) => sum + (a.publishedFiles?.length || 0), 0);

    // Days since creation
    const startDate = selectedInitiative.startDate;
    let daysWorking = 0;
    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      daysWorking = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Gate index for progress
    const gateOrder = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
    const currentGateIdx = gateOrder.indexOf(selectedInitiative.currentGateId || 'G0');
    const progressPct = Math.round(((currentGateIdx) / (gateOrder.length - 1)) * 100);

    const pending = totalDefinitions - generated;

    return {
      generated,
      drafts,
      pending: pending > 0 ? pending : 0,
      totalVersions,
      daysWorking,
      currentGateIdx,
      progressPct,
      startDate: startDate || null,
      endDate: selectedInitiative.endDate || null
    };
  }, [selectedInitiative, totalDefinitions]);

  const selectInitiative = (init: Initiative) => {
    setSelectedInitiative(init);
    setIsSelectorOpen(false);
    setSearchQuery('');
    setMessages([]);
  };

  const handleAnalyze = async () => {
    const prompt = `Analiza el estado actual de la iniciativa "${selectedInitiative?.name || 'actual'}" que está en el gate ${selectedInitiative?.currentGateId || 'G0'}. Tiene ${selectedStats?.generated || 0} artefactos generados y ${selectedStats?.pending || 0} pendientes. Lleva ${selectedStats?.daysWorking || 0} días. Identifica cuellos de botella y recomendaciones.`;
    await triggerChat(prompt);
  };

  const triggerChat = async (text: string) => {
    if (isTyping || !text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    setChatInput('');
    const response = await chatWithAria(text);
    setMessages(prev => [...prev, { role: 'model', text: response || 'Sin respuesta.' }]);
    setIsTyping(false);
  };

  const getGateName = (gateId: string) => {
    const gate = GATES.find(g => g.id === gateId);
    return gate ? gate.name : gateId;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PDLC Management</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Supervisión estratégica del ciclo de vida del producto.</p>
        </div>

        {/* Initiative Selector */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Contexto Global</label>
          <button
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className="flex items-center justify-between w-full md:w-80 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-400 transition-all group"
          >
            <div className="flex items-center space-x-3 truncate">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                <Target size={18} />
              </div>
              <span className="text-sm font-bold text-slate-700 truncate">
                {selectedInitiative?.name || 'Seleccionar Iniciativa'}
              </span>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSelectorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsSelectorOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-full md:w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-3 border-b border-slate-50">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar iniciativa..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                  {isLoadingInitiatives ? (
                    <div className="p-8 text-center">
                      <Loader2 size={20} className="animate-spin text-indigo-600 mx-auto" />
                    </div>
                  ) : filteredSelectorInitiatives.length > 0 ? (
                    filteredSelectorInitiatives.map((init) => (
                      <button
                        key={init.id}
                        onClick={() => selectInitiative(init)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3 ${
                          selectedInitiative?.id === init.id
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          selectedInitiative?.id === init.id ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {init.currentGateId || 'G0'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold leading-tight block truncate">{init.name}</span>
                          <div className={`flex items-center space-x-2 mt-0.5 ${selectedInitiative?.id === init.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <span className="text-[9px] font-medium">{init.product}</span>
                            {init.type && (
                              <>
                                <span className="text-[9px]">•</span>
                                <span className="text-[9px] font-medium">{init.type}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-slate-400 italic">No se encontraron iniciativas</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Timeline gates={GATES} onGateClick={onGateClick} />

      {/* Selected Initiative Detail Panel */}
      {selectedInitiative && selectedStats && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Iniciativa Seleccionada</p>
                <h2 className="text-xl font-extrabold">{selectedInitiative.name}</h2>
                <div className="flex items-center space-x-3 mt-2 text-indigo-200 text-xs">
                  <span>{selectedInitiative.product}</span>
                  {selectedInitiative.type && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">{selectedInitiative.type}</span>
                    </>
                  )}
                  {selectedInitiative.status && (
                    <>
                      <span>•</span>
                      <span>{selectedInitiative.status}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{selectedInitiative.currentGateId || 'G0'}</span>
                  <span className="text-[9px] font-bold text-indigo-200 uppercase">Gate Actual</span>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-200 mb-1.5">
                <span>Progreso del Pipeline</span>
                <span>{selectedStats.progressPct}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${selectedStats.progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                {GATES.map((g, i) => {
                  const isCurrent = g.id === selectedInitiative.currentGateId;
                  const isPast = GATES.findIndex(x => x.id === selectedInitiative.currentGateId) > i;
                  return (
                    <span key={g.id} className={`text-[9px] font-bold ${isCurrent ? 'text-white' : isPast ? 'text-indigo-300' : 'text-indigo-400/50'}`}>
                      {g.id}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-100 border-b border-slate-100">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">{selectedStats.generated}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generados</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertCircle size={18} className="text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600">{selectedStats.pending}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pendientes</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Layers size={18} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-600">{selectedStats.totalVersions}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Versiones</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock size={18} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600">{selectedStats.daysWorking}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Días Activa</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <CalendarDays size={18} className="text-violet-600" />
                </div>
              </div>
              <p className="text-sm font-black text-violet-600">{formatDate(selectedStats.startDate)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inicio</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <CalendarDays size={18} className="text-rose-600" />
                </div>
              </div>
              <p className="text-sm font-black text-rose-600">{formatDate(selectedStats.endDate)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fin Estimado</p>
            </div>
          </div>

          {/* Artifacts by Gate breakdown */}
          <div className="p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Artefactos por Gate</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {GATES.map(gate => {
                const gateArts = (selectedInitiative.artifacts || []).filter(a => a.gate === gate.id);
                const activeCount = gateArts.filter(a => a.status === 'ACTIVE').length;
                const totalCount = gateArts.length;
                const isCurrent = gate.id === selectedInitiative.currentGateId;
                return (
                  <div key={gate.id} className={`rounded-xl p-4 border transition-all ${isCurrent ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`}>{gate.id}</span>
                      {isCurrent && <Activity size={12} className="text-indigo-600" />}
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className={`text-lg font-black ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>{activeCount}</span>
                      <span className="text-[10px] text-slate-400">/ {totalCount || '—'}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 truncate">{gate.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Initiatives by Gate */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
          Iniciativas por Gate
        </h3>

        {isLoadingInitiatives ? (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-slate-500">Cargando iniciativas...</p>
          </div>
        ) : initiatives.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <Target size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay iniciativas en el sistema</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GATES.map(gate => {
              const gateInitiatives = initiativesByGate[gate.id] || [];
              return (
                <div key={gate.id} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                        {gate.id}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{gate.name}</h4>
                        <p className="text-xs text-slate-500">{gate.label}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-indigo-600">
                      {gateInitiatives.length}
                    </span>
                  </div>

                  {gateInitiatives.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {gateInitiatives.map(init => {
                        const artCount = (init.artifacts || []).filter(a => a.status === 'ACTIVE').length;
                        return (
                          <button
                            key={init.id}
                            onClick={() => selectInitiative(init)}
                            className={`w-full text-left bg-white border rounded-lg p-3 hover:border-indigo-300 transition-all ${selectedInitiative?.id === init.id ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100'}`}
                          >
                            <p className="text-xs font-bold text-slate-800 truncate" title={init.name}>{init.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-slate-500">{init.product}</p>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{artCount} artefactos</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      Sin iniciativas
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real KPIs computed from data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Iniciativas</p>
          <h4 className="text-2xl font-black text-slate-900">{initiatives.length}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Artefactos Publicados</p>
          <h4 className="text-2xl font-black text-emerald-600">
            {initiatives.reduce((sum, init) => sum + (init.artifacts || []).filter(a => a.status === 'ACTIVE').length, 0)}
          </h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Versiones</p>
          <h4 className="text-2xl font-black text-indigo-600">
            {initiatives.reduce((sum, init) => sum + (init.artifacts || []).reduce((s, a) => s + (a.publishedFiles?.length || 0), 0), 0)}
          </h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gates con Actividad</p>
          <h4 className="text-2xl font-black text-amber-600">
            {GATES.filter(g => (initiativesByGate[g.id] || []).length > 0).length}
          </h4>
        </div>
      </div>

      {/* Pipeline + ARIA AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
            Progreso por Iniciativa
          </h3>
          <div className="space-y-5 flex-1">
            {initiatives.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No hay iniciativas para mostrar</p>
            ) : (
              initiatives.slice(0, 5).map(init => {
                const gateOrder = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
                const idx = gateOrder.indexOf(init.currentGateId || 'G0');
                const pct = Math.round((idx / (gateOrder.length - 1)) * 100);
                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
                return (
                  <div key={init.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-700 truncate max-w-[250px]">{init.name}</span>
                      <span className="text-slate-400 font-medium text-xs">{init.currentGateId || 'G0'} / G5</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${colors[initiatives.indexOf(init) % colors.length]}`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ARIA Governance AI */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">ARIA Governance AI</h3>
            <Sparkles size={18} className="text-indigo-400" />
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-sm leading-relaxed">
                {selectedInitiative ? (
                  <>Iniciativa <strong>{selectedInitiative.name}</strong> seleccionada en <strong>{selectedInitiative.currentGateId}</strong>. Pulsa <strong>Analizar</strong> para obtener insights y recomendaciones.</>
                ) : (
                  <>Selecciona una iniciativa para activar el análisis con IA. ARIA puede detectar cuellos de botella y generar recomendaciones.</>
                )}
              </p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl text-xs max-w-[90%] ${
                    msg.role === 'user' ? 'bg-slate-800 text-indigo-300' : 'bg-indigo-600/20 text-slate-200 border border-indigo-500/30'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && triggerChat(chatInput)}
                placeholder="Consultar a ARIA..."
                className="w-full bg-slate-800 border-none rounded-xl py-2 pl-4 pr-10 text-xs text-white placeholder-slate-500 outline-none ring-1 ring-slate-700 focus:ring-indigo-500 transition-all"
              />
              <button
                onClick={() => triggerChat(chatInput)}
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!selectedInitiative}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 text-xs"
            >
              Analizar {selectedInitiative?.name ? `"${selectedInitiative.name}"` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
