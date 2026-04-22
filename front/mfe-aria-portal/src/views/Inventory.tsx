
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Briefcase,
  Tag,
  XCircle,
  FileText,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  Calendar,
  User,
  HardDrive,
  LinkIcon,
  Clock,
  AlertCircle
} from 'lucide-react';
import { getAllInitiatives } from '../services/databaseService';
import { downloadLibraryFile } from '../services/libraryService';
import { Initiative, Artifact, ArtifactStatus, PublishedFile } from '../types/types';

type FileStatus = 'active' | 'deleted';

interface InventoryItem {
  artifactId: string;
  artifactName: string;
  gate: string;
  initiativeName: string;
  initiativeId: string;
  version: string;
  filename: string;
  url: string;
  publishedAt: string;
  publishedBy: string;
  status: ArtifactStatus;
  isLatest: boolean;
  fileStatus: FileStatus;
}

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInitiative, setSelectedInitiative] = useState('All');
  const [selectedGate, setSelectedGate] = useState('All');
  const [selectedFileStatus, setSelectedFileStatus] = useState<'All' | 'active' | 'deleted'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'info' | 'danger'}>({show: false, message: '', type: 'info'});
  const itemsPerPage = 8;

  useEffect(() => {
    loadPublishedArtifacts();
  }, []);

  const loadPublishedArtifacts = async () => {
    setIsLoading(true);
    try {
      const [initiatives, bucketFilenames] = await Promise.all([
        getAllInitiatives(),
        fetch('/api/artifacts/files').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      
      const bucketSet = new Set<string>(bucketFilenames as string[]);
      const items: InventoryItem[] = [];

      initiatives.forEach((init: Initiative) => {
        if (init.artifacts && init.artifacts.length > 0) {
          init.artifacts.forEach((art: Artifact) => {
            if (art.status === ArtifactStatus.ACTIVE || art.status === ArtifactStatus.DRAFT) {
              const publishedFiles = art.publishedFiles || [];
              
              if (publishedFiles.length > 0) {
                publishedFiles.forEach((pf, idx) => {
                  const fn = pf.filename || buildFilename(art.name, init.name, pf.version);
                  items.push({
                    artifactId: art.id,
                    artifactName: art.name,
                    gate: art.gate,
                    initiativeName: init.name,
                    initiativeId: init.id,
                    version: pf.version,
                    filename: fn,
                    url: pf.url,
                    publishedAt: pf.publishedAt,
                    publishedBy: pf.publishedBy || 'ARIA AI',
                    status: art.status,
                    isLatest: idx === publishedFiles.length - 1,
                    fileStatus: bucketSet.has(fn) ? 'active' : 'deleted'
                  });
                });
              } else {
                const fn = buildFilename(art.name, init.name, art.version || 'v1.0');
                items.push({
                  artifactId: art.id,
                  artifactName: art.name,
                  gate: art.gate,
                  initiativeName: init.name,
                  initiativeId: init.id,
                  version: art.version || 'v1.0',
                  filename: fn,
                  url: art.link || '',
                  publishedAt: '',
                  publishedBy: 'ARIA AI',
                  status: art.status,
                  isLatest: true,
                  fileStatus: bucketSet.has(fn) ? 'active' : 'deleted'
                });
              }
            }
          });
        }
      });

      items.sort((a, b) => {
        if (a.publishedAt && b.publishedAt) return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        return 0;
      });

      setInventoryItems(items);
      console.log('📦 Loaded inventory items:', items.length, '| bucket files:', bucketSet.size);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildFilename = (artName: string, initName: string, version: string): string => {
    const safeName = artName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').replace(/\s+/g, '_');
    const safeInit = initName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').replace(/\s+/g, '_');
    const safeVersion = version.replace(/[^a-zA-Z0-9._]/g, '');
    return `${safeName}_${safeInit}_${safeVersion}.md`;
  };

  const handleDownloadItem = async (item: InventoryItem) => {
    if (!item.url || item.url === 'Publicado localmente') {
      setNotification({show: true, message: 'Este artefacto no tiene archivo en el bucket para descargar', type: 'danger'});
      setTimeout(() => setNotification({show: false, message: '', type: 'info'}), 3000);
      return;
    }

    const dlKey = `${item.artifactId}-${item.version}`;
    setIsDownloading(dlKey);
    try {
      const filename = item.filename;
      const response = await fetch(`/api/library/download/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error('No se pudo obtener URL de descarga');
      
      const { signedUrl } = await response.json();
      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) throw new Error('No se pudo descargar el archivo');
      
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setNotification({show: true, message: `Descarga iniciada: ${filename}`, type: 'info'});
      setTimeout(() => setNotification({show: false, message: '', type: 'info'}), 3000);
    } catch (error: any) {
      console.error('Error descargando artefacto:', error);
      setNotification({show: true, message: `Error al descargar: ${error.message}`, type: 'danger'});
      setTimeout(() => setNotification({show: false, message: '', type: 'danger'}), 4000);
    } finally {
      setIsDownloading(null);
    }
  };

  const initiatives = useMemo(() => {
    const unique = new Set(inventoryItems.map(a => a.initiativeName).filter(Boolean));
    return ['All', ...Array.from(unique as Set<string>).sort()];
  }, [inventoryItems]);

  const gates = useMemo(() => {
    const unique = new Set(inventoryItems.map(a => a.gate).filter(Boolean));
    return ['All', ...Array.from(unique as Set<string>).sort()];
  }, [inventoryItems]);
  
  const getStatusColor = (status: ArtifactStatus) => {
    switch (status) {
      case ArtifactStatus.ACTIVE: return 'bg-emerald-100 text-emerald-700';
      case ArtifactStatus.DRAFT: return 'bg-amber-100 text-amber-700';
      case ArtifactStatus.PENDING_HITL: return 'bg-indigo-100 text-indigo-700';
      case ArtifactStatus.OBSOLETE: return 'bg-slate-200 text-slate-500';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status: ArtifactStatus) => {
    switch (status) {
      case ArtifactStatus.ACTIVE: return 'Publicado';
      case ArtifactStatus.DRAFT: return 'Borrador';
      case ArtifactStatus.PENDING_HITL: return 'En Revisión';
      case ArtifactStatus.OBSOLETE: return 'Obsoleto';
      default: return status.replace('_', ' ');
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const uniqueArtifactCount = useMemo(() => {
    const unique = new Set(inventoryItems.map(i => `${i.initiativeId}-${i.artifactId}`));
    return unique.size;
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(a => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = a.artifactName.toLowerCase().includes(searchLower) || 
                           a.gate.toLowerCase().includes(searchLower) ||
                           a.initiativeName.toLowerCase().includes(searchLower) ||
                           a.version.toLowerCase().includes(searchLower) ||
                           a.filename.toLowerCase().includes(searchLower);
      
      const matchesInitiative = selectedInitiative === 'All' || a.initiativeName === selectedInitiative;
      const matchesGate = selectedGate === 'All' || a.gate === selectedGate;
      const matchesFileStatus = selectedFileStatus === 'All' || a.fileStatus === selectedFileStatus;

      return matchesSearch && matchesInitiative && matchesGate && matchesFileStatus;
    });
  }, [searchTerm, selectedInitiative, selectedGate, selectedFileStatus, inventoryItems]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedInitiative('All');
    setSelectedGate('All');
    setSelectedFileStatus('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Artefactos Generados</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Repositorio centralizado de documentos vinculados a iniciativas estratégicas.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadPublishedArtifacts}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            <span>Recargar</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
            <Share2 size={18} />
            <span>Exportar Inventario</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Versiones</div>
          <div className="text-2xl font-black text-slate-900">{inventoryItems.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Activos en Bucket</div>
          <div className="text-2xl font-black text-emerald-600">{inventoryItems.filter(a => a.fileStatus === 'active').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Eliminados</div>
          <div className="text-2xl font-black text-red-500">{inventoryItems.filter(a => a.fileStatus === 'deleted').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Artefactos Únicos</div>
          <div className="text-2xl font-black text-amber-600">{uniqueArtifactCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Iniciativas</div>
          <div className="text-2xl font-black text-indigo-600">{initiatives.length - 1}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Filter size={14} />
            <span>Filtros de Auditoría</span>
          </div>
          {(selectedInitiative !== 'All' || selectedGate !== 'All' || selectedFileStatus !== 'All' || searchTerm !== '') && (
            <button 
              onClick={resetFilters}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 uppercase tracking-widest"
            >
              <XCircle size={14} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, gate o iniciativa..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
            <select
              value={selectedInitiative}
              onChange={(e) => { setSelectedInitiative(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold appearance-none transition-all cursor-pointer"
            >
              <option value="All">Todas las Iniciativas</option>
              {initiatives.filter(i => i !== 'All').map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
            <select
              value={selectedGate}
              onChange={(e) => { setSelectedGate(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold appearance-none transition-all cursor-pointer"
            >
              <option value="All">Todos los Gates</option>
              {gates.filter(g => g !== 'All').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
            <select
              value={selectedFileStatus}
              onChange={(e) => { setSelectedFileStatus(e.target.value as 'All' | 'active' | 'deleted'); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold appearance-none transition-all cursor-pointer"
            >
              <option value="All">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="deleted">Eliminado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Cargando artefactos...</p>
        </div>
      )}

      {/* Artifacts Table */}
      {!isLoading && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-center">Gate</th>
                  <th className="px-6 py-4">Iniciativa</th>
                  <th className="px-6 py-4">Artefacto / Archivo</th>
                  <th className="px-6 py-4">Versión</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item, idx) => {
                  const dlKey = `${item.artifactId}-${item.version}`;
                  const isDeleted = item.fileStatus === 'deleted';
                  return (
                    <tr key={`${item.initiativeId}-${item.artifactId}-${item.version}`} className={`transition-colors group ${isDeleted ? 'bg-red-50/30 opacity-70' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <span className={`font-black px-2 py-1 rounded-lg text-xs ring-1 ${isDeleted ? 'text-slate-400 bg-slate-50 ring-slate-200' : 'text-indigo-600 bg-indigo-50 ring-indigo-100'}`}>{item.gate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDeleted ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Briefcase size={14} />
                          </div>
                          <span className={`font-bold text-xs truncate max-w-[160px] ${isDeleted ? 'text-slate-400' : 'text-slate-800'}`}>{item.initiativeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileText size={14} className={isDeleted ? 'text-slate-300 shrink-0' : 'text-slate-300 shrink-0'} />
                          <div className="min-w-0">
                            <div className={`font-black text-xs transition-colors ${isDeleted ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-indigo-600'}`}>{item.artifactName}</div>
                            <div className={`text-[10px] font-mono mt-0.5 truncate ${isDeleted ? 'text-slate-300' : 'text-slate-400'}`}>{item.filename}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-mono px-2 py-1 rounded ${isDeleted ? 'text-slate-400 bg-slate-50' : 'text-slate-700 bg-slate-100'}`}>{item.version}</span>
                          {item.isLatest && !isDeleted && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">ÚLTIMA</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isDeleted ? (
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-red-100 text-red-600 border border-red-200 tracking-widest uppercase">
                            Eliminado
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 tracking-widest uppercase">
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className={`text-xs font-bold ${isDeleted ? 'text-slate-400' : 'text-slate-700'}`}>{formatDate(item.publishedAt)}</div>
                          <div className="text-[10px] text-slate-400">{formatTime(item.publishedAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            title="Ver detalles" 
                            onClick={() => setDetailItem(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          {!isDeleted && (
                            <button 
                              title="Descargar artefacto" 
                              onClick={() => handleDownloadItem(item)}
                              disabled={isDownloading === dlKey}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isDownloading === dlKey ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="p-24 text-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-300">
                <Search size={40} />
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-600 text-lg uppercase tracking-tighter">Sin resultados</p>
                <p className="text-xs max-w-xs mx-auto font-medium">
                  {inventoryItems.length === 0 
                    ? 'No hay artefactos publicados aún. Genera y publica artefactos desde ARIA Generation.'
                    : 'No hay artefactos que coincidan con los criterios de búsqueda o filtros actuales.'}
                </p>
              </div>
              {inventoryItems.length > 0 && (
                <button onClick={resetFilters} className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Restablecer filtros</button>
              )}
            </div>
          ) : (
            <div className="p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Mostrando <span className="text-indigo-600">{Math.min(filteredItems.length, (currentPage-1)*itemsPerPage + 1)}-{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> de <span className="text-slate-900">{filteredItems.length}</span> registros
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                          currentPage === page 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDetailItem(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Detalles del Artefacto</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Información de la versión {detailItem.version}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDetailItem(null)} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <FileText size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Artefacto</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{detailItem.artifactName}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <Briefcase size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Iniciativa</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{detailItem.initiativeName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <Tag size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gate</div>
                      <div className="text-sm font-bold text-indigo-600 mt-1">{detailItem.gate}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <Clock size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versión</div>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-1">{detailItem.version}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <User size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generado por</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">{detailItem.publishedBy}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <Calendar size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Publicación</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">{formatDate(detailItem.publishedAt)}</div>
                      <div className="text-[10px] text-slate-400">{formatTime(detailItem.publishedAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${detailItem.fileStatus === 'deleted' ? 'text-red-500' : 'text-emerald-600'}`} />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Archivo</div>
                      <div className="mt-1 flex items-center space-x-2">
                        {detailItem.fileStatus === 'deleted' ? (
                          <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-100 text-red-600">Eliminado</span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Activo</span>
                        )}
                        {detailItem.isLatest && detailItem.fileStatus !== 'deleted' && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">ÚLTIMA</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <HardDrive size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivo en Bucket</div>
                    <div className="text-xs font-mono text-slate-700 mt-1 break-all">
                      {detailItem.filename}
                    </div>
                  </div>
                </div>

                {detailItem.url && detailItem.url.startsWith('gs://') && (
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <LinkIcon size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL del Bucket</div>
                      <div className="text-xs font-mono text-slate-500 mt-1 break-all">{detailItem.url}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDetailItem(null)}
                  className="py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                >
                  Cerrar
                </button>
                {detailItem.fileStatus === 'deleted' ? (
                  <div className="py-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 border border-red-200">
                    <AlertCircle size={16} />
                    <span>Archivo eliminado</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleDownloadItem(detailItem);
                      setDetailItem(null);
                    }}
                    className="py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center space-x-2 transition-all"
                  >
                    <Download size={16} />
                    <span>Descargar {detailItem.version}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 ${
            notification.type === 'info' ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            {notification.type === 'info' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-medium text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification({show: false, message: '', type: 'info'})}
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

export default Inventory;
