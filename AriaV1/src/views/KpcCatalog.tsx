
import React, { useState, useMemo } from 'react';
import { KPC_PRODUCTS, PORTFOLIO_2026 } from '../constants/constants';
import { 
  Layers, 
  Search, 
  ExternalLink, 
  ChevronRight, 
  Target, 
  Cpu, 
  Box, 
  Settings2, 
  Globe, 
  ShieldCheck, 
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Tag,
  Briefcase,
  LayoutGrid,
  List,
  Filter,
  Package,
  Server
} from 'lucide-react';
import { KpcProduct, KpcModule } from '../types/types';

const KpcCatalog: React.FC = () => {
  const [viewMode, setViewMode] = useState<'details' | 'explorer'>('details');
  const [selectedProductId, setSelectedProductId] = useState<string>(KPC_PRODUCTS[0].id);
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'architecture' | 'offering' | 'governance'>('identity');
  
  // Explorer Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterCapability, setFilterCapability] = useState('');
  const [filterService, setFilterService] = useState('');

  const selectedProduct = useMemo(() => {
    return KPC_PRODUCTS.find(p => p.id === selectedProductId) || KPC_PRODUCTS[0];
  }, [selectedProductId]);

  const masterList = useMemo(() => {
    return KPC_PRODUCTS.map(product => {
      const initiative = PORTFOLIO_2026.find(i => i.id === product.pdlcInitiativeId);
      return {
        ...product,
        portfolio: initiative?.portfolio || 'TBD',
        itServices: initiative?.itServices || 'TBD'
      };
    });
  }, []);

  // Filtered list for the details view sidebar
  const filteredProducts = useMemo(() => {
    return masterList.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [masterList, searchQuery]);

  const filteredExplorerList = useMemo(() => {
    return masterList.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = filterPlatform === 'All' || item.portfolio === filterPlatform;
      const matchesDomain = filterDomain === 'All' || item.domain === filterDomain;
      
      const matchesCapability = filterCapability === '' || 
                               item.modules.some(m => m.name.toLowerCase().includes(filterCapability.toLowerCase()));
      
      const matchesService = filterService === '' || 
                            item.modules.some(m => m.services.some(s => s.name.toLowerCase().includes(filterService.toLowerCase())));

      return matchesSearch && matchesPlatform && matchesDomain && matchesCapability && matchesService;
    });
  }, [masterList, searchQuery, filterPlatform, filterDomain, filterCapability, filterService]);

  const uniquePlatforms = useMemo(() => ['All', ...Array.from(new Set(masterList.map(i => i.portfolio)))], [masterList]);
  const uniqueDomains = useMemo(() => ['All', ...Array.from(new Set(masterList.map(i => i.domain)))], [masterList]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Draft': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Deprecated': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">KPC – Product Catalog</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Single Source of Truth de Productos, Servicios y Ofertas Kashio.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewMode('details')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'details' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Detalle</span>
          </button>
          <button 
            onClick={() => setViewMode('explorer')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'explorer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List size={14} />
            <span>Explorador</span>
          </button>
        </div>
      </div>

      {viewMode === 'explorer' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Filter size={14} />
              <span>Filtros de Búsqueda de Catálogo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Nombre o Código..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                >
                  <option disabled>Plataforma</option>
                  {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="relative">
                <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                >
                  <option disabled>Familia / Dominio</option>
                  {uniqueDomains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="relative">
                <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Capacidades..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterCapability}
                  onChange={(e) => setFilterCapability(e.target.value)}
                />
              </div>
              <div className="relative">
                <Server size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="IT Services..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Explorer List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4">Producto / Código</th>
                  <th className="px-8 py-4">Plataforma</th>
                  <th className="px-8 py-4">Familia</th>
                  <th className="px-8 py-4">IT Services / Capas</th>
                  <th className="px-8 py-4">Estado</th>
                  <th className="px-8 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExplorerList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 leading-tight">{item.name}</div>
                      <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{item.code}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-tighter">
                        {item.portfolio}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                        <Tag size={12} className="text-slate-300" />
                        <span>{item.domain}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[200px]">
                        {item.itServices}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {item.modules.slice(0, 2).map(m => (
                          <span key={m.code} className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                            {m.code}
                          </span>
                        ))}
                        {item.modules.length > 2 && <span className="text-[8px] text-slate-300 font-bold">+{item.modules.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg border tracking-tighter uppercase ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => { setSelectedProductId(item.id); setViewMode('details'); }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExplorerList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 italic font-medium">
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Product Selection */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar producto..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      selectedProductId === p.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'hover:bg-slate-50 border-transparent text-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${selectedProductId === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {p.code}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${selectedProductId === p.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {p.version}
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-tight truncate">{p.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Detail Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Detail Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4 max-w-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter shadow-sm ${getStatusColor(selectedProduct.status)}`}>
                      {selectedProduct.status}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">CODE: {selectedProduct.code}</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedProduct.name}</h2>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                      <Briefcase size={14} className="text-indigo-400" />
                      <span>Dominio: {selectedProduct.domain}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                      <Globe size={14} className="text-indigo-400" />
                      <span>Región: {selectedProduct.region}</span>
                    </div>
                  </div>
                </div>

                {/* PDLC Linkage Info */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 w-full md:w-auto min-w-[280px]">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    <History size={14} className="text-indigo-500" />
                    <span>Vinculación ARIA/PDLC</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Iniciativa Origen:</span>
                      <span className="font-bold text-indigo-600 hover:underline cursor-pointer">{selectedProduct.pdlcInitiativeId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Gate Publicación:</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black">{selectedProduct.pdlcGate}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Generado por:</span>
                      <span className="flex items-center text-emerald-600 font-bold">
                        <Cpu size={12} className="mr-1" /> ARIA Engine
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs Navigation */}
              <div className="flex space-x-8 border-b border-slate-100 mt-10">
                {[
                  { id: 'identity', label: 'Identity & Segment', icon: Target },
                  { id: 'architecture', label: 'Architecture & Services', icon: Box },
                  { id: 'offering', label: 'Offering & Commercial', icon: Tag },
                  { id: 'governance', label: 'Governance & History', icon: ShieldCheck },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest flex items-center space-x-2 transition-all relative ${
                      activeSubTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                    {activeSubTab === tab.id && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content Rendering */}
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              {activeSubTab === 'identity' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Identidad Canónica</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Canonical Name', value: selectedProduct.name },
                        { label: 'Product Code', value: selectedProduct.code },
                        { label: 'Product Type', value: 'Platform Product' },
                        { label: 'Dominio de Negocio', value: selectedProduct.domain },
                        { label: 'Responsable (Owner)', value: selectedProduct.owner },
                        { label: 'Target Segment', value: selectedProduct.targetSegment },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between border-b border-slate-50 pb-3">
                          <span className="text-xs font-bold text-slate-400 uppercase">{row.label}</span>
                          <span className="text-sm font-semibold text-slate-700">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Configuradores del Producto</h3>
                    <div className="space-y-4">
                      {selectedProduct.configs.length > 0 ? (
                        selectedProduct.configs.map(cfg => (
                          <div key={cfg.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
                            <div>
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{cfg.key}</p>
                              <p className="text-xs text-slate-500 font-medium">{cfg.description}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-mono font-bold text-slate-700">{cfg.defaultValue}</span>
                              <span className={`text-[8px] font-black uppercase ${cfg.editable ? 'text-emerald-500' : 'text-red-400'}`}>
                                {cfg.editable ? 'Editable' : 'Solo lectura'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-sm text-center py-10">Sin configuradores definidos en esta versión.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'architecture' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <Box size={20} className="text-indigo-600 mr-2" />
                        Módulos y Business Capabilities
                      </h3>
                      <div className="flex space-x-2">
                        <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 size={12} className="mr-1" /> Ready for Onboarding
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {selectedProduct.modules.map(mod => (
                        <div key={mod.code} className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm group">
                          <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{mod.code}</span>
                              <h4 className="font-bold text-slate-900">{mod.name}</h4>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Versión</span>
                              <span className="text-xs font-mono font-bold text-slate-600">{mod.version}</span>
                            </div>
                          </div>
                          <div className="p-5 space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicios Asociados</p>
                            {mod.services.map(srv => (
                              <div key={srv.code} className="flex items-center justify-between group/srv">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    srv.type === 'Core' ? 'bg-indigo-500' : srv.type === 'AI' ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}></div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 block leading-none">{srv.name}</span>
                                    <span className="text-[9px] text-slate-400 font-medium">Source: {srv.source}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                  srv.type === 'AI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                  {srv.type}
                                </span>
                              </div>
                            ))}
                          </div>
                          {mod.mandatory && (
                            <div className="bg-indigo-600 text-white text-[9px] font-black uppercase text-center py-1">
                              Módulo Mandatorio para GA
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedProduct.modules.length === 0 && (
                        <div className="col-span-2 py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
                          <Cpu size={40} className="mx-auto text-slate-300" />
                          <p className="text-sm text-slate-500 font-bold italic">Esperando aprobación de Gate G4 para mapear módulos técnicos.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'offering' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Offering Comercial (Capa 7)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre Comercial</label>
                          <p className="text-lg font-black text-indigo-900">{selectedProduct.offering.name}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pricing Model</label>
                          <p className="text-sm font-bold text-slate-700">{selectedProduct.offering.pricing}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nivel de SLA</label>
                          <p className="text-sm font-bold text-emerald-600 flex items-center">
                            <ShieldCheck size={16} className="mr-1.5" /> {selectedProduct.offering.sla} Guaranteed
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulos Incluidos</p>
                        {selectedProduct.offering.modules.map(m => (
                          <div key={m} className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                      <Activity size={20} className="text-indigo-600 mr-2" />
                      KPIs de Producto
                    </h3>
                    <div className="flex-1 space-y-6">
                      {[
                        { label: 'Adopción Automática', value: '72%', trend: 'up' },
                        { label: 'MTTR de Errores', value: '14 min', trend: 'down' },
                        { label: 'Revenue/Client (Avg)', value: '$1.4K', trend: 'up' },
                      ].map(kpi => (
                        <div key={kpi.label} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0">
                          <div>
                            <p className="text-xs font-bold text-slate-500">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                          </div>
                          <div className={`text-[10px] font-bold uppercase ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {kpi.trend === 'up' ? '▲ Creciendo' : '▼ Decreciendo'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center space-x-2">
                      <Activity size={14} />
                      <span>Ver Observabilidad en VEGA</span>
                    </button>
                  </div>
                </div>
              )}

              {activeSubTab === 'governance' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Historial de Versiones KPC</h3>
                      <p className="text-xs text-slate-500 mt-1">Control de auditoría vinculado a las iniciativas PDLC.</p>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 shadow-sm">
                        Comparar Versiones
                      </button>
                    </div>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4">Versión</th>
                        <th className="px-8 py-4">Estado</th>
                        <th className="px-8 py-4">Iniciativa Origen</th>
                        <th className="px-8 py-4">Gate</th>
                        <th className="px-8 py-4 text-right">Documentación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-indigo-50/30">
                        <td className="px-8 py-5 font-mono font-black text-indigo-700">{selectedProduct.version}</td>
                        <td className="px-8 py-5">
                          <span className="flex items-center text-[10px] font-black text-emerald-600 uppercase">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                            Activa (Actual)
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-700">{selectedProduct.pdlcInitiativeId}</td>
                        <td className="px-8 py-5">
                           <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-black">{selectedProduct.pdlcGate}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                            <ExternalLink size={18} />
                          </button>
                        </td>
                      </tr>
                      <tr className="opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                        <td className="px-8 py-5 font-mono font-bold text-slate-500">v1.1.0</td>
                        <td className="px-8 py-5">
                          <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase">
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></div>
                            Archivada
                          </span>
                        </td>
                        <td className="px-8 py-5 text-slate-500">PDLC-2025-088</td>
                        <td className="px-8 py-5 text-slate-400 font-bold">G5</td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                            <ExternalLink size={18} />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpcCatalog;
