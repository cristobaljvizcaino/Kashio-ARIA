import React, { useState, useMemo, useEffect } from 'react';
import { getAllInitiatives, updateInitiative } from '../services/databaseService';
import { 
  Calendar,
  X,
  Edit2,
  Save,
  Briefcase,
  Clock,
  AlertCircle,
  Loader2,
  GripVertical,
  ChevronRight,
  Target,
  CheckCircle2,
  XCircle,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Initiative } from '../types/types';

// Quarters desde Q1-2026 hasta Q4-2027 (8 quarters)
const QUARTERS = [
  { id: 'backlog', label: 'Backlog', year: null, q: null },
  { id: 'Q1-2026', label: 'Q1 2026', year: 2026, q: 1 },
  { id: 'Q2-2026', label: 'Q2 2026', year: 2026, q: 2 },
  { id: 'Q3-2026', label: 'Q3 2026', year: 2026, q: 3 },
  { id: 'Q4-2026', label: 'Q4 2026', year: 2026, q: 4 },
  { id: 'Q1-2027', label: 'Q1 2027', year: 2027, q: 1 },
  { id: 'Q2-2027', label: 'Q2 2027', year: 2027, q: 2 },
  { id: 'Q3-2027', label: 'Q3 2027', year: 2027, q: 3 },
  { id: 'Q4-2027', label: 'Q4 2027', year: 2027, q: 4 },
];

const Prioritization: React.FC = () => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterGate, setFilterGate] = useState<string>('all');

  // Load initiatives from database
  useEffect(() => {
    loadInitiatives();
  }, []);

  const loadInitiatives = async () => {
    setIsLoading(true);
    try {
      const data = await getAllInitiatives();
      // Solo mostrar iniciativas que están en G1 o posterior
      const g1PlusInitiatives = data.filter(init => init.currentGateId !== 'G0');
      setInitiatives(g1PlusInitiatives);
      console.log('✅ Loaded initiatives for Prioritization:', g1PlusInitiatives.length);
    } catch (error) {
      console.error('❌ Error loading initiatives:', error);
      setInitiatives([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular quarter basado en endDate
  const calculateQuarter = (endDate: string | undefined): string => {
    if (!endDate) return 'backlog';
    
    try {
      const date = new Date(endDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 0-indexed
      
      let quarter = 1;
      if (month >= 1 && month <= 3) quarter = 1;
      else if (month >= 4 && month <= 6) quarter = 2;
      else if (month >= 7 && month <= 9) quarter = 3;
      else quarter = 4;
      
      return `Q${quarter}-${year}`;
    } catch {
      return 'backlog';
    }
  };

  // Unique gates from initiatives for filter options
  const availableGates = useMemo(() => {
    const gates = new Set<string>();
    initiatives.forEach(init => {
      if (init.currentGateId) gates.add(init.currentGateId);
    });
    return Array.from(gates).sort();
  }, [initiatives]);

  // Filtered initiatives based on filters
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(init => {
      const matchesGate = filterGate === 'all' || init.currentGateId === filterGate;
      const matchesQuarter = filterQuarter === 'all' || 
        (init.quarter || calculateQuarter(init.endDate)) === filterQuarter;
      return matchesGate && matchesQuarter;
    });
  }, [initiatives, filterGate, filterQuarter]);

  const hasActiveFilters = filterQuarter !== 'all' || filterGate !== 'all';

  // Agrupar iniciativas por quarter
  const initiativesByQuarter = useMemo(() => {
    const groups: Record<string, Initiative[]> = {};
    
    // Inicializar todos los quarters
    QUARTERS.forEach(q => {
      groups[q.id] = [];
    });
    
    // Asignar iniciativas filtradas a quarters
    filteredInitiatives.forEach(init => {
      const quarter = init.quarter || calculateQuarter(init.endDate);
      if (groups[quarter]) {
        groups[quarter].push(init);
      } else {
        groups['backlog'].push(init);
      }
    });
    
    return groups;
  }, [filteredInitiatives]);

  // Abrir modal de edición
  const handleEditDates = (init: Initiative) => {
    setEditingInitiative(init);
    setEditStartDate(init.startDate || '');
    setEditEndDate(init.endDate || '');
    setShowEditModal(true);
  };

  // Guardar cambios de fechas
  const handleSaveDates = async () => {
    if (!editingInitiative) return;

    try {
      const quarter = calculateQuarter(editEndDate);
      
      await updateInitiative(editingInitiative.id, {
        startDate: editStartDate,
        endDate: editEndDate,
        quarter
      });

      // Actualizar estado local
      setInitiatives(prev => prev.map(init => 
        init.id === editingInitiative.id 
          ? { ...init, startDate: editStartDate, endDate: editEndDate, quarter }
          : init
      ));

      setShowEditModal(false);
      setEditingInitiative(null);
      setEditStartDate('');
      setEditEndDate('');
      
      setNotification({show: true, message: 'Fechas actualizadas correctamente', type: 'success'});
      setTimeout(() => setNotification({show: false, message: '', type: 'success'}), 4000);
    } catch (error) {
      console.error('Error saving dates:', error);
      setNotification({show: true, message: 'Error al guardar fechas', type: 'error'});
      setTimeout(() => setNotification({show: false, message: '', type: 'success'}), 4000);
    }
  };

  // Mover iniciativa a otro quarter
  const moveToQuarter = async (initiativeId: string, newQuarter: string) => {
    try {
      await updateInitiative(initiativeId, { quarter: newQuarter });
      
      setInitiatives(prev => prev.map(init => 
        init.id === initiativeId 
          ? { ...init, quarter: newQuarter }
          : init
      ));
      
      console.log(`✅ Moved initiative to ${newQuarter}`);
    } catch (error) {
      console.error('Error moving initiative:', error);
    }
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Sin fecha';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Priorización de Iniciativas</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Roadmap estratégico desde Q1-2026 hasta Q4-2027</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadInitiatives}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            <span>Recargar</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Iniciativas</p>
          <h4 className="text-3xl font-black text-slate-900">{initiatives.length}</h4>
          <p className="text-xs text-slate-500 mt-2">En priorización</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Backlog</p>
          <h4 className="text-3xl font-black text-amber-600">{initiativesByQuarter['backlog']?.length || 0}</h4>
          <p className="text-xs text-amber-600 mt-2">Sin priorizar</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">2026</p>
          <h4 className="text-3xl font-black text-indigo-600">
            {(initiativesByQuarter['Q1-2026']?.length || 0) + 
             (initiativesByQuarter['Q2-2026']?.length || 0) + 
             (initiativesByQuarter['Q3-2026']?.length || 0) + 
             (initiativesByQuarter['Q4-2026']?.length || 0)}
          </h4>
          <p className="text-xs text-indigo-600 mt-2">Este año</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">2027</p>
          <h4 className="text-3xl font-black text-emerald-600">
            {(initiativesByQuarter['Q1-2027']?.length || 0) + 
             (initiativesByQuarter['Q2-2027']?.length || 0) + 
             (initiativesByQuarter['Q3-2027']?.length || 0) + 
             (initiativesByQuarter['Q4-2027']?.length || 0)}
          </h4>
          <p className="text-xs text-emerald-600 mt-2">Próximo año</p>
        </div>
      </div>

      {/* Filter Bar */}
      {!isLoading && initiatives.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center space-x-2 text-slate-500">
              <Filter size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
            </div>

            {/* Quarter Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Quarter:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterQuarter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all ${
                    filterQuarter === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  Todos
                </button>
                {QUARTERS.map(q => (
                  <button
                    key={q.id}
                    onClick={() => setFilterQuarter(q.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all ${
                      filterQuarter === q.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gate Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Gate:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterGate('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all ${
                    filterGate === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  Todos
                </button>
                {availableGates.map(gate => (
                  <button
                    key={gate}
                    onClick={() => setFilterGate(gate)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all ${
                      filterGate === gate
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  >
                    {gate}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterQuarter('all'); setFilterGate('all'); }}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg border border-red-200 transition-all ml-auto"
              >
                <RotateCcw size={12} />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-medium">Mostrando:</span>
              <span className="text-xs font-bold text-indigo-600">
                {filteredInitiatives.length} de {initiatives.length} iniciativas
              </span>
              {filterQuarter !== 'all' && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold flex items-center space-x-1">
                  <span>Q: {QUARTERS.find(q => q.id === filterQuarter)?.label || filterQuarter}</span>
                  <button onClick={() => setFilterQuarter('all')} className="hover:text-red-500 ml-1"><X size={10} /></button>
                </span>
              )}
              {filterGate !== 'all' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold flex items-center space-x-1">
                  <span>Gate: {filterGate}</span>
                  <button onClick={() => setFilterGate('all')} className="hover:text-red-500 ml-1"><X size={10} /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 size={40} className="animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-600 font-medium">Cargando iniciativas...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && initiatives.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Target size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No hay iniciativas para priorizar</p>
          <p className="text-xs text-slate-400 mt-2">Las iniciativas aparecerán aquí cuando pasen del Gate 0</p>
        </div>
      )}

      {/* Swimlane View - Quarters */}
      {!isLoading && initiatives.length > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {QUARTERS
              .filter((quarter) => {
                if (filterQuarter !== 'all') return quarter.id === filterQuarter;
                const qInits = initiativesByQuarter[quarter.id] || [];
                return qInits.length > 0;
              })
              .map((quarter) => {
              const quarterInitiatives = initiativesByQuarter[quarter.id] || [];
              const isBacklog = quarter.id === 'backlog';
              
              return (
                <div 
                  key={quarter.id}
                  className={`flex-shrink-0 w-80 bg-white rounded-2xl border-2 ${
                    isBacklog ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
                  } shadow-sm`}
                >
                  {/* Column Header */}
                  <div className={`p-4 border-b ${isBacklog ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-black ${isBacklog ? 'text-amber-900' : 'text-slate-900'} uppercase tracking-tight`}>
                        {quarter.label}
                      </h3>
                      <span className={`text-xl font-black ${
                        isBacklog ? 'text-amber-600' : 
                        quarter.year === 2026 ? 'text-indigo-600' : 'text-emerald-600'
                      }`}>
                        {quarterInitiatives.length}
                      </span>
                    </div>
                  </div>

                  {/* Initiative Cards */}
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {quarterInitiatives.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-400 italic">Sin iniciativas</p>
                      </div>
                    ) : (
                      quarterInitiatives.map((init) => (
                        <div 
                          key={init.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group cursor-pointer"
                          onClick={() => handleEditDates(init)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                                {init.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1">{init.product}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDates(init);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>

                          {/* Dates */}
                          <div className="flex items-center space-x-2 text-xs">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-slate-600">
                              {formatDate(init.startDate)} → {formatDate(init.endDate)}
                            </span>
                          </div>

                          {/* Gate Status */}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 uppercase">
                              {init.currentGateId}
                            </span>
                            {init.status && (
                              <span className="text-[10px] text-slate-500">{init.status}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Dates Modal - Sin backdrop */}
      {showEditModal && editingInitiative && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Editar Fechas</h2>
                    <p className="text-slate-500 text-sm mt-1">{editingInitiative.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Fecha de Finalización
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                  />
                  {editEndDate && (
                    <p className="text-xs text-indigo-600 mt-2">
                      Se ubicará en: <strong>{calculateQuarter(editEndDate)}</strong>
                    </p>
                  )}
                </div>

                {/* Current Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-bold mb-1">Información actual:</p>
                      <ul className="space-y-1">
                        <li><strong>Gate:</strong> {editingInitiative.currentGateId}</li>
                        <li><strong>Producto:</strong> {editingInitiative.product}</li>
                        <li><strong>Quarter actual:</strong> {editingInitiative.quarter || 'Backlog'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDates}
                  className="py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>Guardar Fechas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-medium text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification({show: false, message: '', type: 'success'})}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prioritization;
