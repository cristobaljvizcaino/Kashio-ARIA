
import React, { useState, useMemo, useEffect } from 'react';
import { INTAKE_REQUESTS } from '../constants/constants';
import { 
  Plus, 
  Search, 
  ClipboardList, 
  ChevronRight, 
  User, 
  Briefcase, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Clock,
  Layers,
  Activity,
  Globe
} from 'lucide-react';
import { IntakeRequest } from '../types/types';
import { analyzeIntakeRequest } from '../services/geminiService';
import { getAllIntakeRequests, createIntakeRequest } from '../services/databaseService';
import SearchableSelect from '../components/SearchableSelect';

const Intake: React.FC = () => {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Cargar intakes de BD al montar
  useEffect(() => {
    loadIntakes();
  }, []);

  const loadIntakes = async () => {
    setIsLoading(true);
    try {
      const data = await getAllIntakeRequests();
      setRequests(data);
      console.log('✅ Loaded intakes from DB:', data.length);
    } catch (error) {
      console.error('❌ Error loading intakes:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Partial<IntakeRequest>>({
    title: '',
    requester: '',
    area: 'Producto',
    type: 'Mejora',
    product: 'Pasarela',
    domain: 'PSP',
    region: 'Perú',
    impactType: 'Operativo',
    severity: 'P2',
    urgency: 'Next',
    problem: '',
    outcome: '',
    scope: [],
    constraints: '',
    alternatives: ''
  });

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.requester.toLowerCase().includes(search.toLowerCase()) || 
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase())
    );
  }, [requests, search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleScope = (item: string) => {
    setFormData(prev => {
      const currentScope = prev.scope || [];
      if (currentScope.includes(item)) {
        return { ...prev, scope: currentScope.filter(i => i !== item) };
      } else {
        return { ...prev, scope: [...currentScope, item] };
      }
    });
  };

  const handleCreateIntake = async () => {
    if (!formData.title || !formData.requester || !formData.problem) return;
    
    setIsAnalyzing(true);
    
    try {
      const analysis = await analyzeIntakeRequest(formData);
      
      const newRequest: IntakeRequest = {
        ...formData as IntakeRequest,
        id: `INT-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: 'G0_Intake',
        createdAt: new Date().toISOString().split('T')[0],
        ariaAnalysis: analysis
      };

      // Guardar en base de datos
      await createIntakeRequest(newRequest);
      console.log('✅ Intake guardado en BD:', newRequest.id);
      
      // Actualizar lista local
      setRequests(prev => [newRequest, ...prev]);
      setIsAnalyzing(false);
      setView('list');
      
      // Limpiar formulario
      setFormData({
        title: '',
        requester: '',
        area: 'Producto',
        type: 'Mejora',
        product: 'Pasarela',
        domain: 'PSP',
        region: 'Perú',
        impactType: 'Operativo',
        severity: 'P2',
        urgency: 'Next',
        problem: '',
        outcome: '',
        scope: [],
        constraints: '',
        alternatives: ''
      });
    } catch (error) {
      console.error('❌ Error creating intake:', error);
      setIsAnalyzing(false);
      alert('Error al crear intake. Revisa la consola para más detalles.');
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'P0': return 'text-red-600 bg-red-50 border-red-100';
      case 'P1': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'P2': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'G0_Intake': return 'bg-indigo-600 text-white';
      case 'G1_Framing': return 'bg-emerald-600 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Intake Hub v2</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Clasificación, ruta estratégica y control de gobernanza G0–G1.</p>
        </div>
        {view === 'list' ? (
          <button 
            onClick={() => setView('new')}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all scale-105 active:scale-95"
          >
            <Plus size={20} />
            <span>Nuevo Requerimiento</span>
          </button>
        ) : (
          <button 
            onClick={() => setView('list')}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm flex items-center space-x-2"
          >
            <X size={18} />
            <span>Ver Listado</span>
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendientes de Gate</p>
              <h4 className="text-2xl font-black text-slate-900">{requests.filter(r => r.status === 'G0_Intake').length}</h4>
              <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter flex items-center">
                 <CheckCircle2 size={12} className="mr-1" /> 2 Procesados hoy
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impacto Crítico (P0)</p>
              <h4 className="text-2xl font-black text-red-600">{requests.filter(r => r.severity === 'P0').length}</h4>
              <div className="mt-2 text-[10px] font-bold text-red-400 uppercase tracking-tighter">Fast track activado</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SLA de Respuesta</p>
              <h4 className="text-2xl font-black text-indigo-600">92%</h4>
              <div className="mt-2 text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Meta: 95%</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ARIA Discovery</p>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <Activity size={12} className="mr-1" /> Engine On
                </span>
              </div>
              <Sparkles size={24} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>

          {/* Search & Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ID, Solicitante, Producto..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">ID / Solicitud</th>
                    <th className="px-8 py-4">Contexto</th>
                    <th className="px-8 py-4">Impacto</th>
                    <th className="px-8 py-4">Análisis ARIA</th>
                    <th className="px-8 py-4 text-right">Status PDLC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{req.id}</div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {req.title || req.type}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-1">
                          <span className="text-indigo-600 font-black">{req.type}</span> • Solicitado por: <span className="font-bold text-slate-500">{req.requester}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-2 mb-1">
                           <Globe size={12} className="text-slate-400" />
                           <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-tighter">{req.product}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{req.domain} • {req.region}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border tracking-tighter uppercase ${getSeverityColor(req.severity)}`}>
                          {req.severity} • {req.urgency}
                        </span>
                        {req.scope && req.scope.length > 0 && (
                          <div className="flex gap-1 mt-2">
                             {req.scope.slice(0, 2).map(s => <span key={s} className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">{s}</span>)}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 max-w-xs">
                        <div className="flex items-start space-x-2">
                          <Sparkles size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-2 group-hover:line-clamp-none">
                            {req.ariaAnalysis}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg tracking-tighter uppercase ${getStatusBadge(req.status)}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Multi-Section Form */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION 1: IDENTIFICATION & CONTROL (G0) */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Identificación & Control (G0)</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Control de solicitante y tipo</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título / Resumen *</label>
                  <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    type="text" 
                    placeholder="Ej: Portal de Empresas - Mejora de Experiencia de Usuario" 
                    className="w-full px-4 py-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-base font-bold transition-all placeholder:text-slate-400" 
                  />
                  <p className="text-xs text-slate-500 mt-2 italic">Este será el nombre de la iniciativa en todo el sistema ARIA</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Solicitante *</label>
                  <input name="requester" value={formData.requester} onChange={handleInputChange} type="text" placeholder="Ej: Maria Orellana" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Área *</label>
                  <SearchableSelect
                    value={formData.area || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, area: value }))}
                    options={[
                      { value: 'Producto', label: 'Producto' },
                      { value: 'Comercial', label: 'Comercial' },
                      { value: 'Operaciones', label: 'Operaciones' },
                      { value: 'TI', label: 'TI' },
                      { value: 'Soporte', label: 'Soporte' }
                    ]}
                    placeholder="Seleccionar área..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Solicitud *</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {['Bug', 'Mejora', 'Estratégica', 'Regulatorio', 'Deuda Técnica'].map(t => (
                      <button key={t} onClick={() => setFormData(prev => ({ ...prev, type: t as any }))} className={`px-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${formData.type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTEXTO DE NEGOCIO (G0) */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Contexto de Negocio (G0)</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Impacto, Riesgo y Priorización</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Producto Kashio *</label>
                  <SearchableSelect
                    value={formData.product || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, product: value }))}
                    options={[
                      { value: 'Pasarela', label: 'Pasarela' },
                      { value: 'Recaudo', label: 'Recaudo' },
                      { value: 'Payouts', label: 'Payouts' },
                      { value: 'Portal Empresa', label: 'Portal Empresa' },
                      { value: 'Conexión Única', label: 'Conexión Única' }
                    ]}
                    placeholder="Seleccionar producto..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">País / Región *</label>
                  <select name="region" value={formData.region} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none">
                    <option>Perú</option><option>México</option><option>Chile</option><option>Colombia</option><option>Regional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impacto Principal *</label>
                  <select name="impactType" value={formData.impactType} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none">
                    <option>Operativo</option><option>Financiero</option><option>Experiencia Cliente</option><option>Comercial</option><option>Regulatorio</option>
                  </select>
                </div>
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Severidad (ARIA scoring)</label>
                      <div className="flex gap-2">
                        {['P0', 'P1', 'P2', 'P3'].map(p => (
                          <button key={p} onClick={() => setFormData(prev => ({ ...prev, severity: p as any }))} className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all ${formData.severity === p ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium italic">P0: Dinero en riesgo / P3: Bajo impacto estético</p>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Urgencia Requerida</label>
                      <div className="flex gap-2">
                        {['Now', 'Next', 'Later'].map(u => (
                          <button key={u} onClick={() => setFormData(prev => ({ ...prev, urgency: u as any }))} className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all ${formData.urgency === u ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                            {u}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium italic">Now: ≤7 días / Next: ≤30 días / Later: Backlog</p>
                   </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PROBLEMA & OUTCOME (G1) */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Problema & Outcome (G1)</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Framing del requerimiento</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    🧠 ¿Qué está pasando hoy? (Problema) *
                  </label>
                  <textarea name="problem" value={formData.problem} onChange={handleInputChange} rows={3} placeholder="Describe el dolor actual..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    🎯 Outcome Esperado (Impacto) *
                  </label>
                  <textarea name="outcome" value={formData.outcome} onChange={handleInputChange} rows={2} placeholder="¿Qué debería mejorar si esto se resuelve?..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" />
                </div>
              </div>
            </div>

            {/* SECTION 4: ALCANCE & RESTRICCIONES (G1 -> G2) */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Alcance & Restricciones (G1 → G2)</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Límites de la solución</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Alcance Preliminar</label>
                  <div className="flex flex-wrap gap-2">
                    {['Backend', 'Frontend', 'API', 'Integración externa', 'Datos / Reporting', 'Mobile'].map(s => (
                      <button key={s} onClick={() => toggleScope(s)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${formData.scope?.includes(s) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                        {formData.scope?.includes(s) ? '✓ ' + s : s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Restricciones Conocidas</label>
                    <textarea name="constraints" value={formData.constraints} onChange={handleInputChange} rows={2} placeholder="Regulaciones, SLAs, Legacy..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Workaround Existente?</label>
                    <textarea name="alternatives" value={formData.alternatives} onChange={handleInputChange} rows={2} placeholder="¿Cómo lo resolvemos hoy?" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-6 space-y-6">
               <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-12 -bottom-12 text-indigo-500/10 group-hover:text-indigo-500/20 transition-all duration-1000 scale-150">
                    <Zap size={200} />
                  </div>
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black flex items-center">
                        <Sparkles size={20} className="text-indigo-400 mr-2" />
                        ARIA Analyze
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                        <Activity size={14} className="text-indigo-300" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Motor de Clasificación</h4>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                          Al enviar, ARIA determinará si el requerimiento es un Bug Crítico (G4), una Mejora Estándar (G1) o requiere Discovery Profundo (G2).
                        </p>
                      </div>
                      <button 
                        onClick={handleCreateIntake}
                        disabled={!formData.title || !formData.requester || !formData.problem || isAnalyzing}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Procesando G0–G1...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} />
                            <span>Enviar Requerimiento</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                     <AlertCircle size={14} className="mr-2" /> PDLC Rules Engine
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${formData.problem!.length > 20 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                          <CheckCircle2 size={14} />
                       </div>
                       <p className="text-[11px] font-bold text-slate-600">Definición de Problema & Outcomes</p>
                    </div>
                    <div className="flex items-start space-x-3">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${formData.scope!.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                          <CheckCircle2 size={14} />
                       </div>
                       <p className="text-[11px] font-bold text-slate-600">Alcance de Tecnología (Capa 1–4)</p>
                    </div>
                    <div className="flex items-start space-x-3">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${formData.severity !== 'P2' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}`}>
                          <Clock size={14} />
                       </div>
                       <p className="text-[11px] font-bold text-slate-600">Justificación de Urgencia</p>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                      💡 Pro-tip: Especificar el alcance reduce las dudas en la sesión de Discovery G2 en un 50%.
                    </p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Intake;
