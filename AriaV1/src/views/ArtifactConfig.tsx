import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  FileText,
  Target,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Layers,
  Filter,
  RotateCcw,
  Search
} from 'lucide-react';
import { 
  getAllArtifactDefinitions, 
  createArtifactDefinition, 
  updateArtifactDefinition, 
  deleteArtifactDefinition,
  type ArtifactDefinition 
} from '../services/artifactDefinitionService';
import { ArtifactArea } from '../types/types';
import ConfirmModal from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';

const GATES = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
const AREAS: ArtifactArea[] = ['Producto', 'Comercial', 'Tecnología', 'Negocio', 'Operaciones', 'Customer', 'Finanzas'];

const ArtifactConfig: React.FC = () => {
  const [definitions, setDefinitions] = useState<ArtifactDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDef, setEditingDef] = useState<ArtifactDefinition | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, def: ArtifactDefinition | null}>({show: false, def: null});

  // Filter state
  const [filterGate, setFilterGate] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMandatory, setFilterMandatory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const hasActiveFilters = filterGate !== 'all' || filterType !== 'all' || filterMandatory !== 'all' || searchText !== '';

  const filteredDefinitions = useMemo(() => {
    return definitions.filter(def => {
      const matchesGate = filterGate === 'all' || def.gate === filterGate;
      const matchesType = filterType === 'all' || def.initiativeType === filterType;
      const matchesMandatory = filterMandatory === 'all' || 
        (filterMandatory === 'yes' ? def.mandatory : !def.mandatory);
      const matchesSearch = searchText === '' || 
        def.name.toLowerCase().includes(searchText.toLowerCase());
      return matchesGate && matchesType && matchesMandatory && matchesSearch;
    });
  }, [definitions, filterGate, filterType, filterMandatory, searchText]);

  const availableGates = useMemo(() => {
    const gates = new Set<string>();
    definitions.forEach(d => gates.add(d.gate));
    return Array.from(gates).sort();
  }, [definitions]);

  const resetFilters = () => {
    setFilterGate('all');
    setFilterType('all');
    setFilterMandatory('all');
    setSearchText('');
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formGate, setFormGate] = useState('G1');
  const [formInitiativeType, setFormInitiativeType] = useState<'Change' | 'Run' | 'Both'>('Both');
  const [formPredecessors, setFormPredecessors] = useState<string[]>([]);
  const [formMandatory, setFormMandatory] = useState(true);
  const [formArea, setFormArea] = useState<ArtifactArea>('Producto');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    loadDefinitions();
  }, []);

  // Limpiar predecesores inválidos cuando cambia el gate
  useEffect(() => {
    const currentGateNum = parseInt(formGate.replace('G', ''));
    
    // Filtrar predecesores que son de gates posteriores al gate seleccionado
    const validPredecessors = formPredecessors.filter(predId => {
      const predDef = definitions.find(d => d.id === predId);
      if (!predDef) return false;
      
      const predGateNum = parseInt(predDef.gate.replace('G', ''));
      return predGateNum <= currentGateNum;
    });
    
    // Si cambiaron, actualizar automáticamente
    if (validPredecessors.length !== formPredecessors.length) {
      setFormPredecessors(validPredecessors);
      console.log(`🧹 Limpiados ${formPredecessors.length - validPredecessors.length} predecesores inválidos`);
    }
  }, [formGate, definitions]);

  const loadDefinitions = async () => {
    setIsLoading(true);
    try {
      const data = await getAllArtifactDefinitions();
      setDefinitions(data);
    } catch (error) {
      console.error('Error loading definitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDef(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (def: ArtifactDefinition) => {
    setEditingDef(def);
    setFormName(def.name);
    setFormGate(def.gate);
    setFormInitiativeType(def.initiativeType);
    setFormPredecessors(def.predecessorIds);
    setFormMandatory(def.mandatory);
    setFormArea(def.area || 'Producto');
    setFormDescription(def.description || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormGate('G1');
    setFormInitiativeType('Both');
    setFormPredecessors([]);
    setFormMandatory(true);
    setFormArea('Producto');
    setFormDescription('');
  };

  const handleSave = async () => {
    if (!formName) return;

    try {
      if (editingDef) {
        // Actualizar
        await updateArtifactDefinition(editingDef.id, {
          name: formName,
          gate: formGate,
          initiativeType: formInitiativeType,
          predecessorIds: formPredecessors,
          mandatory: formMandatory,
          area: formArea,
          description: formDescription
        });
      } else {
        // Crear nuevo
        const newDef: ArtifactDefinition = {
          id: `DEF-${formGate}-${Date.now()}`,
          gate: formGate,
          name: formName,
          initiativeType: formInitiativeType,
          predecessorIds: formPredecessors,
          mandatory: formMandatory,
          area: formArea,
          description: formDescription
        };
        await createArtifactDefinition(newDef);
      }

      await loadDefinitions();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving definition:', error);
      alert('Error al guardar: ' + error);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.def) return;

    try {
      await deleteArtifactDefinition(confirmDelete.def.id);
      await loadDefinitions();
      setConfirmDelete({show: false, def: null});
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar: ' + error);
    }
  };

  const getInitiativeTypeBadge = (type: string) => {
    switch (type) {
      case 'Change': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Run': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Both': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAreaBadge = (area: string) => {
    switch (area) {
      case 'Producto': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Comercial': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Tecnología': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Negocio': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Operaciones': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Customer': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Finanzas': return 'bg-lime-50 text-lime-700 border-lime-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configuración de Artefactos</h1>
          <p className="text-slate-500 mt-2 font-medium italic">
            Define qué artefactos se generan en cada gate según el tipo de iniciativa
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus size={20} />
          <span>Crear Artefacto</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Artefactos</p>
          <h4 className="text-3xl font-black text-slate-900">{definitions.length}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Solo Change</p>
          <h4 className="text-3xl font-black text-indigo-600">
            {definitions.filter(d => d.initiativeType === 'Change').length}
          </h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Solo Run</p>
          <h4 className="text-3xl font-black text-emerald-600">
            {definitions.filter(d => d.initiativeType === 'Run').length}
          </h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Obligatorios</p>
          <h4 className="text-3xl font-black text-amber-600">
            {definitions.filter(d => d.mandatory).length}
          </h4>
        </div>
      </div>

      {/* Filters */}
      {!isLoading && definitions.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center space-x-2 text-slate-500 shrink-0">
              <Filter size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Gate Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Gate:</span>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setFilterGate('all')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterGate === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>Todos</button>
                {availableGates.map(g => (
                  <button key={g} onClick={() => setFilterGate(g)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterGate === g ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>{g}</button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tipo:</span>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setFilterType('all')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterType === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'}`}>Todos</button>
                <button onClick={() => setFilterType('Change')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterType === 'Change' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>Change</button>
                <button onClick={() => setFilterType('Run')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterType === 'Run' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>Run</button>
                <button onClick={() => setFilterType('Both')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterType === 'Both' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'}`}>Both</button>
              </div>
            </div>

            {/* Mandatory Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Oblig:</span>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setFilterMandatory('all')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterMandatory === 'all' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}>Todos</button>
                <button onClick={() => setFilterMandatory('yes')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterMandatory === 'yes' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}>Si</button>
                <button onClick={() => setFilterMandatory('no')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${filterMandatory === 'no' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}>No</button>
              </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg border border-red-200 transition-all ml-auto shrink-0">
                <RotateCcw size={12} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-medium">Mostrando:</span>
              <span className="text-xs font-bold text-indigo-600">{filteredDefinitions.length} de {definitions.length} artefactos</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600">Cargando definiciones...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Gate</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nombre del Artefacto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Área</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tipo Iniciativa</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Predecesores</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Obligatorio</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDefinitions.map(def => (
                <tr key={def.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black">
                      {def.gate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-900">{def.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getAreaBadge(def.area || 'Producto')}`}>
                      {def.area || 'Producto'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getInitiativeTypeBadge(def.initiativeType)}`}>
                      {def.initiativeType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {def.predecessorIds.length > 0 ? (
                      <span className="text-xs text-slate-600">
                        {def.predecessorIds.length} predecesor(es)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Ninguno</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {def.mandatory ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <span className="text-xs text-slate-400">Opcional</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(def)}
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({show: true, def})}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/30">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 my-8">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {editingDef ? 'Editar Artefacto' : 'Crear Artefacto'}
                    </h2>
                    <p className="text-slate-500 text-sm">Configuración de definición de artefacto</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Artefacto</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Documento BRM"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Gate */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gate</label>
                  <SearchableSelect
                    value={formGate}
                    onChange={setFormGate}
                    options={GATES.map(g => ({ value: g, label: g }))}
                  />
                </div>

                {/* Obligatorio + Área */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Obligatorio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Obligatorio</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormMandatory(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${
                          formMandatory
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMandatory(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${
                          !formMandatory
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  {/* Área */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Área</label>
                    <SearchableSelect
                      value={formArea}
                      onChange={(val) => setFormArea(val as ArtifactArea)}
                      options={AREAS.map(a => ({ value: a, label: a }))}
                    />
                  </div>
                </div>

                {/* Tipo de Iniciativa */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Aplica a Tipo de Iniciativa</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormInitiativeType('Run')}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border-2 ${
                        formInitiativeType === 'Run'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      🔧 Run
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormInitiativeType('Change')}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border-2 ${
                        formInitiativeType === 'Change'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      🚀 Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormInitiativeType('Both')}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border-2 ${
                        formInitiativeType === 'Both'
                          ? 'bg-purple-50 text-purple-700 border-purple-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Ambos
                    </button>
                  </div>
                </div>

                {/* Predecesores */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Artefactos Predecesores (solo gates anteriores o mismo gate)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {definitions
                      .filter(d => {
                        // No permitir auto-referencia
                        if (d.id === editingDef?.id) return false;
                        
                        // Solo permitir gates anteriores o mismo gate
                        const currentGateNum = parseInt(formGate.replace('G', ''));
                        const defGateNum = parseInt(d.gate.replace('G', ''));
                        
                        return defGateNum <= currentGateNum;
                      })
                      .map(def => {
                        const isSelected = formPredecessors.includes(def.id);
                        return (
                          <button
                            key={def.id}
                            type="button"
                            onClick={() => {
                              setFormPredecessors(prev =>
                                isSelected
                                  ? prev.filter(id => id !== def.id)
                                  : [...prev, def.id]
                              );
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{def.gate} - {def.name}
                          </button>
                        );
                      })}
                  </div>
                  {formPredecessors.length === 0 && (
                    <p className="text-xs text-slate-400 italic mt-2">
                      Sin predecesores - Este artefacto estará siempre habilitado
                    </p>
                  )}
                  {definitions.filter(d => {
                    const currentGateNum = parseInt(formGate.replace('G', ''));
                    const defGateNum = parseInt(d.gate.replace('G', ''));
                    return defGateNum <= currentGateNum && d.id !== editingDef?.id;
                  }).length === 0 && (
                    <p className="text-xs text-amber-600 italic mt-2">
                      ℹ️ No hay artefactos de gates anteriores disponibles para seleccionar como predecesores
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descripción (Opcional)</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descripción del artefacto..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formName}
                  className="py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg disabled:opacity-50"
                >
                  <Save size={16} className="inline mr-2" />
                  {editingDef ? 'Guardar Cambios' : 'Crear Artefacto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.show}
        title="¿Eliminar definición de artefacto?"
        message={confirmDelete.def ? `Se eliminará "${confirmDelete.def.name}". Las iniciativas existentes no se verán afectadas.` : ''}
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({show: false, def: null})}
      />
    </div>
  );
};

export default ArtifactConfig;

