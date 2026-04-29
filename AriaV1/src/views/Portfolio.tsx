
import React, { useState, useMemo, useEffect } from 'react';
import { PORTFOLIO_2026 } from '../constants/constants';
import { getAllInitiatives } from '../services/databaseService';
import { Initiative } from '../types/types';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Download,
  Calendar,
  User,
  ExternalLink,
  Tag,
  Users,
  Briefcase,
  Loader2,
  Target,
  AlertCircle
} from 'lucide-react';

const Portfolio: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('All');
  const [selectedSquad, setSelectedSquad] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedGate, setSelectedGate] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Cargar de BD
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitiatives();
  }, []);

  const loadInitiatives = async () => {
    setIsLoading(true);
    try {
      const data = await getAllInitiatives();
      setInitiatives(data);
      console.log('✅ Loaded initiatives for Portfolio:', data.length);
    } catch (error) {
      console.error('❌ Error loading initiatives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique products and gates for filters
  const products = useMemo(() => {
    const p = new Set(initiatives.map(item => item.product).filter(Boolean));
    return ['All', ...Array.from(p).sort()];
  }, [initiatives]);

  const gates = useMemo(() => {
    const g = new Set(initiatives.map(item => item.currentGateId).filter(Boolean));
    return ['All', ...Array.from(g).sort()];
  }, [initiatives]);

  const filteredItems = useMemo(() => {
    return initiatives.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = selectedProduct === 'All' || item.product === selectedProduct;
      const matchesGate = selectedGate === 'All' || item.currentGateId === selectedGate;
      
      return matchesSearch && matchesProduct && matchesGate;
    });
  }, [searchTerm, selectedProduct, selectedGate, initiatives]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('definición')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (s.includes('diseño')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s.includes('curso')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('pendiente')) return 'bg-slate-100 text-slate-600 border-slate-200';
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portafolio de Iniciativas 2026</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestión estratégica del roadmap, squads y dominios operativos.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white shadow-sm transition-all">
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Filter size={14} />
          <span>Filtros de Búsqueda</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search by Name */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none transition-all cursor-pointer"
            >
              <option value="All">Todos los Productos</option>
              {products.filter(p => p !== 'All').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Gate Filter */}
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={selectedGate}
              onChange={(e) => { setSelectedGate(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none transition-all cursor-pointer"
            >
              <option value="All">Todos los Gates</option>
              {gates.filter(g => g !== 'All').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600">Cargando iniciativas...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && initiatives.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Target size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No hay iniciativas en el portafolio</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Las iniciativas creadas en ARIA Generation aparecerán aquí
          </p>
        </div>
      )}

      {/* Table Container */}
      {!isLoading && initiatives.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Iniciativa</th>
                  <th className="px-6 py-4">Gate Actual</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Artefactos</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{item.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                      <Briefcase size={12} className="text-indigo-400" />
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] tracking-tight">
                        {item.product}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[280px]">
                    <div className="font-bold text-slate-900 leading-tight truncate" title={item.name}>{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <Target size={14} className="text-amber-500" />
                      <span className="font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg text-xs border border-amber-100">
                        {item.currentGateId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{item.startDate ? new Date(item.startDate).toLocaleDateString('es-ES', {month: 'short', year: '2-digit'}) : '-'}</span>
                      <span className="text-slate-300">→</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{item.endDate ? new Date(item.endDate).toLocaleDateString('es-ES', {month: 'short', year: '2-digit'}) : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-700">
                      {item.artifacts?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border tracking-tighter uppercase shadow-sm ${getStatusBadge(item.status || 'Pendiente')}`}>
                      {item.status || 'En curso'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <Search size={48} className="text-slate-300" />
                      <p className="text-slate-500 font-bold">No se encontraron iniciativas que coincidan con los filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-400">
            Mostrando <span className="text-indigo-600">{paginatedItems.length}</span> de {filteredItems.length} resultados totales
          </div>
          
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Simple pagination logic for displaying a few pages around current
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i + 1;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return pageNum;
              }).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                    currentPage === page 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' 
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Portfolio;
