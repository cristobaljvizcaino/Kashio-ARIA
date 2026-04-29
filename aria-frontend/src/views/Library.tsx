import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Info,
  ExternalLink,
  FileBadge,
  LayoutGrid,
  ListFilter,
  Upload,
  Download,
  Trash2,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  File,
  FolderOpen,
  Edit2,
  Save
} from 'lucide-react';
import { getAllLibraryFiles, uploadNewFile, downloadLibraryFile, deleteLibraryFile, updateLibraryFileMetadata, getLibraryFileMetadata, type LibraryFile } from '../services/libraryService';
import ConfirmModal from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';

type Category = 'Contexto' | 'Output' | 'Prompt' | 'Template' | 'All';

const Library: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for files
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<Exclude<Category, 'All'>>('Contexto');
  const [isUploading, setIsUploading] = useState(false);

  // Confirm modal state
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, file: LibraryFile | null}>({show: false, file: null});
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'info' | 'danger'}>({show: false, message: '', type: 'info'});

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState<LibraryFile | null>(null);
  const [editName, setEditName] = useState('');
  const [editGate, setEditGate] = useState(0);
  const [editFlow, setEditFlow] = useState<'Run' | 'Change' | 'Both'>('Both');
  const [editActive, setEditActive] = useState(true);
  const [editDescription, setEditDescription] = useState('');

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedFiles = await getAllLibraryFiles();
      
      // Enriquecer con metadatos de localStorage
      const enrichedFiles = loadedFiles.map(file => ({
        ...file,
        ...getLibraryFileMetadata(file.id)
      }));
      
      setFiles(enrichedFiles);
      console.log('📚 Loaded library files:', enrichedFiles.length);
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err.message || 'Error al cargar archivos');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (file: LibraryFile) => {
    setEditingFile(file);
    setEditName(file.name);
    setEditGate(file.gate || 0);
    setEditFlow(file.flow || 'Both');
    setEditActive(file.active !== false); // Default true
    setEditDescription(file.description || '');
    setShowEditModal(true);
  };

  const handleSaveMetadata = async () => {
    if (!editingFile) return;

    try {
      await updateLibraryFileMetadata(editingFile.id, {
        name: editName,
        gate: editGate,
        flow: editFlow,
        active: editActive,
        description: editDescription
      });

      // Recargar archivos
      await loadFiles();
      setShowEditModal(false);
      setNotification({show: true, message: 'Metadatos actualizados exitosamente', type: 'info'});
      setTimeout(() => setNotification({show: false, message: '', type: 'info'}), 3000);
    } catch (err: any) {
      setNotification({show: true, message: `Error al actualizar: ${err.message}`, type: 'danger'});
      setTimeout(() => setNotification({show: false, message: '', type: 'danger'}), 4000);
    }
  };

  const categories: Category[] = ['All', 'Contexto', 'Output', 'Prompt', 'Template'];

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory;
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [files, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(start, start + itemsPerPage);
  }, [filteredFiles, currentPage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const newFile = await uploadNewFile(uploadFile, uploadCategory);
      setFiles(prev => [...prev, newFile]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCategory('Contexto');
      // Reload files to get fresh data from bucket
      await loadFiles();
      setNotification({show: true, message: 'Archivo subido exitosamente', type: 'info'});
      setTimeout(() => setNotification({show: false, message: '', type: 'info'}), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setNotification({show: true, message: `Error al subir archivo: ${err.message}`, type: 'danger'});
      setTimeout(() => setNotification({show: false, message: '', type: 'danger'}), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: LibraryFile) => {
    try {
      const blob = await downloadLibraryFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setNotification({show: true, message: `Error al descargar: ${err.message}`, type: 'danger'});
      setTimeout(() => setNotification({show: false, message: '', type: 'danger'}), 4000);
    }
  };

  const handleDelete = (file: LibraryFile) => {
    setConfirmDelete({show: true, file});
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.file) return;

    try {
      await deleteLibraryFile(confirmDelete.file.id);
      setFiles(prev => prev.filter(f => f.id !== confirmDelete.file!.id));
      setConfirmDelete({show: false, file: null});
      setNotification({show: true, message: 'Archivo eliminado exitosamente', type: 'info'});
      setTimeout(() => setNotification({show: false, message: '', type: 'info'}), 3000);
    } catch (err: any) {
      setNotification({show: true, message: `Error al eliminar: ${err.message}`, type: 'danger'});
      setTimeout(() => setNotification({show: false, message: '', type: 'danger'}), 4000);
      setConfirmDelete({show: false, file: null});
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Contexto': return 'bg-blue-100 text-blue-700';
      case 'Output': return 'bg-emerald-100 text-emerald-700';
      case 'Prompt': return 'bg-purple-100 text-purple-700';
      case 'Template': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncateFilename = (filename: string, maxLength: number = 50): string => {
    if (filename.length <= maxLength) return filename;
    
    // Encontrar la extensión
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    
    // Calcular cuántos caracteres mostrar del inicio y del final
    const availableLength = maxLength - extension.length - 3; // 3 for "..."
    const startLength = Math.ceil(availableLength * 0.6); // 60% al inicio
    const endLength = Math.floor(availableLength * 0.4); // 40% al final
    
    const start = nameWithoutExt.substring(0, startLength);
    const end = nameWithoutExt.substring(nameWithoutExt.length - endLength);
    
    return `${start}...${end}${extension}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Librería de Fuentes ARIA</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Repositorio centralizado de archivos fuente para generación de artefactos.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadFiles()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            <span>Recargar</span>
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            <Upload size={14} />
            <span>Cargar Archivo</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar archivos..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 size={40} className="animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-600 font-medium">Cargando archivos de la librería...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && files.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <FolderOpen size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No hay archivos en la librería</p>
          <p className="text-xs text-slate-400 mt-2">Haz click en "Cargar Archivo" para agregar uno</p>
        </div>
      )}

      {/* Files Table */}
      {!isLoading && !error && filteredFiles.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[11%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Archivo</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Categoría</th>
                  <th className="px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Gate</th>
                  <th className="px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Flujo</th>
                  <th className="px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Tamaño</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha</th>
                  <th className="px-3 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                          <FileText size={16} className="text-indigo-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 truncate" title={file.name}>
                            {truncateFilename(file.name, 40)}
                          </p>
                          <p className="text-xs text-slate-400 font-mono truncate" title={file.id}>
                            {truncateFilename(file.id, 30)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold ${getCategoryColor(file.category)}`}>
                        {file.category}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {file.gate !== undefined && file.gate > 0 ? (
                        <span className="inline-flex px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold">
                          G{file.gate}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center">
                      {file.flow ? (
                        <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold ${
                          file.flow === 'Run' ? 'bg-emerald-50 text-emerald-700' :
                          file.flow === 'Change' ? 'bg-purple-50 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {file.flow}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex w-2.5 h-2.5 rounded-full ${
                        file.active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} title={file.active !== false ? 'Activo' : 'Inactivo'} />
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs text-slate-600">{formatFileSize(file.size)}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs text-slate-600">{formatDate(file.uploadedAt)}</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(file)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar metadatos"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Descargar"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-600">
                Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredFiles.length)}</span> de{' '}
                <span className="font-bold">{filteredFiles.length}</span> archivos
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!isLoading && !error && files.length > 0 && filteredFiles.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Search size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No se encontraron archivos</p>
          <p className="text-xs text-slate-400 mt-2">Intenta con otra búsqueda o categoría</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowUploadModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Cargar Archivo</h2>
                    <p className="text-slate-500 text-sm mt-1">Sube un archivo a la librería de fuentes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* File Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Seleccionar Archivo
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-sm hover:border-indigo-400 transition-all cursor-pointer"
                  />
                  {uploadFile && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-slate-600">
                      <File size={16} className="text-indigo-600" />
                      <span className="font-medium">{uploadFile.name}</span>
                      <span className="text-xs text-slate-400">({formatFileSize(uploadFile.size)})</span>
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Categoría
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Contexto', 'Output', 'Prompt', 'Template'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setUploadCategory(cat)}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                          uploadCategory === cat
                            ? `${getCategoryColor(cat)} border-current`
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3">
                  <Info size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-bold mb-1">Tipos de categoría:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li><strong>Contexto:</strong> Información de referencia, benchmarks, regulaciones</li>
                      <li><strong>Output:</strong> Documentos generados por ARIA</li>
                      <li><strong>Prompt:</strong> Instrucciones para generación</li>
                      <li><strong>Template:</strong> Plantillas base para artefactos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading}
                  className="py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Subir Archivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.show}
        title="¿Eliminar archivo?"
        message={confirmDelete.file ? `Se eliminará "${confirmDelete.file.name}". Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({show: false, file: null})}
      />

      {/* Edit Metadata Modal */}
      {showEditModal && editingFile && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Editar Archivo</h2>
                    <p className="text-slate-500 text-sm">Actualizar metadatos y clasificación</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Archivo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gate</label>
                    <SearchableSelect
                      value={editGate.toString()}
                      onChange={(val) => setEditGate(parseInt(val))}
                      options={[
                        { value: '0', label: 'G0 - Intake' },
                        { value: '1', label: 'G1 - Requerimiento' },
                        { value: '2', label: 'G2 - Roadmap' },
                        { value: '3', label: 'G3 - Release' },
                        { value: '4', label: 'G4 - Build' },
                        { value: '5', label: 'G5 - Publicación' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Flow</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Run', 'Change', 'Both'].map((flow) => (
                        <button
                          key={flow}
                          type="button"
                          onClick={() => setEditFlow(flow as any)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${
                            editFlow === flow
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {flow}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estado</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditActive(true)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border-2 ${
                        editActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      ✓ Activo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditActive(false)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border-2 ${
                        !editActive
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      ✗ Inactivo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descripción (Opcional)</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción del archivo..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMetadata}
                  className="py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>Guardar Cambios</span>
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
            notification.type === 'info' ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            {notification.type === 'info' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{notification.message}</span>
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

export default Library;
