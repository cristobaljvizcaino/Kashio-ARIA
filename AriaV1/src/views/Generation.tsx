
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Loader2, 
  UserCheck, 
  FileText, 
  Sparkles, 
  Plus, 
  LayoutGrid, 
  ChevronRight,
  Target,
  Clock,
  Wand2,
  Edit2,
  Save,
  RotateCcw,
  X,
  Search,
  Check,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Settings,
  Upload,
  FileCheck,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { generateArtifactContent } from '../services/geminiService';
import { generatePDF, downloadPDF, previewPDF } from '../services/pdfService';
import { getAllLibraryFiles, downloadLibraryFile, publishArtifactContent, publishArtifactPdf, type LibraryFile } from '../services/libraryService';
import { getAllIntakeRequests, getAllInitiatives, createInitiative, updateInitiative } from '../services/databaseService';
import { getArtifactDefinitionsForInitiative } from '../services/artifactDefinitionService';
import { Initiative, Artifact, ArtifactStatus, IntakeRequest } from '../types/types';
import { GATES, PORTFOLIO_2026, INTAKE_REQUESTS } from '../constants/constants';
import SearchableSelect from '../components/SearchableSelect';
import { resetAllInitiatives } from '../utils/resetDatabase';
import { saveGenerationLog } from '../utils/generationLogger';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Document version type
interface DocumentVersion {
  id: string;
  version: string;
  content: string;
  pdfBlob: Blob | null;
  generatedAt: Date;
  generatedBy: string;
}

// Extended Artifact type with versions and definition metadata
interface ExtendedArtifact extends Artifact {
  versions?: DocumentVersion[];
  expanded?: boolean;
  predecessorIds?: string[];
  description?: string;
  mandatory?: boolean;
}

const Generation: React.FC = () => {
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [intakeData, setIntakeData] = useState<IntakeRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGateId, setSelectedGateId] = useState('G0');
  
  // Cargar intakes y iniciativas de BD
  const [dbIntakes, setDbIntakes] = useState<IntakeRequest[]>([]);
  const [dbInitiatives, setDbInitiatives] = useState<Initiative[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactPreview, setArtifactPreview] = useState<string | null>(null);
  const [artifactPdfBlob, setArtifactPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const [expandedPublished, setExpandedPublished] = useState<Set<string>>(new Set());

  // Config modal state
  const [configArtifactId, setConfigArtifactId] = useState<string | null>(null);
  const [configContext, setConfigContext] = useState<string[]>([]);
  const [configPrompt, setConfigPrompt] = useState<string>('');
  const [configTemplate, setConfigTemplate] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>(''); // Prompt personalizado del usuario

  // Library files state
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Modal / Selection state
  const [searchPortfolio, setSearchPortfolio] = useState('');
  const [formName, setFormName] = useState('');
  const [formProduct, setFormProduct] = useState('Conexión Única');
  const [formType, setFormType] = useState<'Change' | 'Run'>('Run'); // Default: Run (más común)

  // Progress Calculation is defined after allGateDefinitions state (see below)

  // Filtrar archivos de librería por tipo
  const contextFiles = useMemo(() => 
    libraryFiles.filter(f => f.category === 'Contexto' || f.category === 'Output'),
    [libraryFiles]
  );

  const promptFiles = useMemo(() => 
    libraryFiles.filter(f => f.category === 'Prompt'),
    [libraryFiles]
  );

  const templateFiles = useMemo(() => 
    libraryFiles.filter(f => f.category === 'Template'),
    [libraryFiles]
  );

  useEffect(() => {
    if (modalMode === 'edit' && initiative) {
      setFormName(initiative.name);
      setFormProduct(initiative.product);
      setFormType(initiative.type || 'Run'); // Cargar tipo desde iniciativa
      console.log('📝 Editando iniciativa, tipo actual:', initiative.type);
    } else if (modalMode === 'create') {
      setFormName('');
      setFormProduct('Conexión Única');
      setFormType('Run'); // Default Run
      setSearchPortfolio('');
    }
  }, [modalMode, initiative, showModal]);

  // Limpiar campos del modal de configuración cada vez que se abre
  useEffect(() => {
    if (showConfigModal) {
      setConfigContext([]);
      setConfigPrompt('');
      setConfigTemplate('');
      setCustomPrompt('');
    }
  }, [showConfigModal]);

  // Cargar intakes e iniciativas de BD al montar
  useEffect(() => {
    loadDataFromDB();
  }, []);

  const loadDataFromDB = async () => {
    setIsLoadingDB(true);
    try {
      const [intakes, initiatives] = await Promise.all([
        getAllIntakeRequests(),
        getAllInitiatives()
      ]);
      
      // Filtrar solo iniciativas G1+ (que ya pasaron del intake)
      const g1PlusInitiatives = initiatives.filter(init => init.currentGateId !== 'G0');
      
      setDbIntakes(intakes);
      setDbInitiatives(g1PlusInitiatives);
      console.log('✅ Loaded from DB:', intakes.length, 'intakes,', g1PlusInitiatives.length, 'initiatives G1+');
      
      // NO mostrar modal automáticamente - solo al hacer click en "Nueva Iniciativa"
    } catch (error) {
      console.error('❌ Error loading from DB:', error);
    } finally {
      setIsLoadingDB(false);
    }
  };

  // Cargar artefactos dinámicos del gate actual
  const [dynamicArtifacts, setDynamicArtifacts] = useState<ExtendedArtifact[]>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  // Definiciones de todos los gates para el sidebar
  const [allGateDefinitions, setAllGateDefinitions] = useState<Record<string, { total: number; mandatoryCount: number; names: string[]; ids: string[] }>>({});

  useEffect(() => {
    if (initiative && selectedGateId) {
      loadArtifactsForGate();
    }
  }, [initiative, selectedGateId]);

  // Load all gate definitions for sidebar counts
  useEffect(() => {
    if (initiative) {
      loadAllGateDefinitions();
    }
  }, [initiative]);

  const loadAllGateDefinitions = async () => {
    if (!initiative) return;
    const initType = initiative.type || 'Run';
    try {
      const results: Record<string, { total: number; mandatoryCount: number; names: string[]; ids: string[] }> = {};
      const gateIds = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
      for (const gateId of gateIds) {
        const defs = await getArtifactDefinitionsForInitiative(gateId, initType);
        results[gateId] = {
          total: defs.length,
          mandatoryCount: defs.filter(d => d.mandatory).length,
          names: defs.map(d => d.name),
          ids: defs.map(d => d.id)
        };
      }
      setAllGateDefinitions(results);
    } catch (error) {
      console.error('Error loading gate definitions:', error);
    }
  };

  // Progress Calculation - based on definitions total, not just saved artifacts
  const progressStats = useMemo(() => {
    if (!initiative) return { percent: 0, completed: 0, total: 0 };
    const totalFromDefs = Object.values(allGateDefinitions).reduce((sum, g) => sum + g.total, 0);
    const total = totalFromDefs || initiative.artifacts.length;
    const completed = initiative.artifacts.filter(a => a.status === ArtifactStatus.ACTIVE).length;
    return {
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total
    };
  }, [initiative, allGateDefinitions]);

  const loadArtifactsForGate = async () => {
    if (!initiative) return;
    
    setIsLoadingArtifacts(true);
    try {
      // Cargar definiciones dinámicamente según el tipo de iniciativa
      const initiativeType = initiative.type || 'Run'; // Default Run si no está definido
      console.log(`📋 Cargando artefactos para ${selectedGateId} con tipo: ${initiativeType}`);
      
      const artifactDefs = await getArtifactDefinitionsForInitiative(
        selectedGateId,
        initiativeType
      );
      
      // Convertir definiciones a artefactos con estado
      const artifacts: ExtendedArtifact[] = artifactDefs.map((def, index) => {
        // Match by multiple strategies to survive renames:
        // 1) definitionId field (future-proof), 2) def ID in artifact ID, 3) exact name, 4) name contained in def name or vice-versa
        const existing = initiative.artifacts?.find(a => {
          if (a.gate !== def.gate) return false;
          const ext = a as any;
          if (ext.definitionId && ext.definitionId === def.id) return true;
          if (a.id && a.id.includes(def.id)) return true;
          if (a.name === def.name) return true;
          // Partial match: old name contained in new name or vice versa (handles "SAD" → "2.3. SAD")
          if (a.name && def.name && (def.name.includes(a.name) || a.name.includes(def.name))) return true;
          return false;
        }) as ExtendedArtifact;
        
                    if (existing) {
                      // Merge: keep existing data but apply latest definition fields + updated name
                      return {
                        ...existing,
                        name: def.name,
                        definitionId: def.id,
                        mandatory: def.mandatory,
                        predecessorIds: def.predecessorIds,
                        category: def.area || existing.category || 'Producto',
                        description: def.description || '',
                      } as ExtendedArtifact;
                    }
        
        // Crear nuevo artefacto basado en definición
        return {
          id: `art-${initiative.id}-${def.id}`,
          gate: def.gate,
          name: def.name,
          definitionId: def.id,
          category: def.area || 'Producto',
          version: 'v0.1',
          status: ArtifactStatus.NOT_STARTED,
          artifactType: 'Output',
          destination: ['Confluence'],
          versions: [],
          expanded: false,
          predecessorIds: def.predecessorIds,
          mandatory: def.mandatory,
          description: def.description || ''
        } as any;
      });
      
      setDynamicArtifacts(artifacts);
      console.log(`✅ Loaded ${artifacts.length} artifacts for ${selectedGateId} (type: ${initiative.type})`);
    } catch (error) {
      console.error('Error loading artifacts for gate:', error);
      setDynamicArtifacts([]);
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Cargar archivos de la librería cada vez que se abre el modal de configuración
  useEffect(() => {
    if (showConfigModal) {
      loadLibraryFiles();
    }
  }, [showConfigModal]);

  const loadLibraryFiles = async () => {
    setIsLoadingLibrary(true);
    try {
      const files = await getAllLibraryFiles();
      setLibraryFiles(files);
      console.log('✅ Library files loaded for Generation:', files.length);
    } catch (error) {
      console.error('❌ Error loading library files:', error);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Cargar datos del intake si estamos en G0
  useEffect(() => {
    if (initiative && selectedGateId === 'G0' && !intakeData) {
      // Buscar intake relacionado con esta iniciativa usando intakeRequestId
      if (initiative.intakeRequestId) {
        const relatedIntake = dbIntakes.find(intake => intake.id === initiative.intakeRequestId);
        if (relatedIntake) {
          setIntakeData(relatedIntake);
        }
      }
    }
  }, [initiative, selectedGateId, intakeData, dbIntakes]);

  const handleSelectFromPortfolio = (p: typeof PORTFOLIO_2026[0]) => {
    setFormName(p.name);
    // Logic to determine product based on portfolio or defaults
    setFormProduct(p.portfolio === 'Plataforma' ? 'Conexión Única' : 'Kashio Cards');
  };

  const handleCreateOrUpdateInitiative = async () => {
    if (!formName) return;
    
    if (modalMode === 'create') {
      // Cargar artefactos dinámicamente según el tipo de iniciativa
      const allArtifactDefs = await Promise.all(
        ['G1', 'G2', 'G3', 'G4', 'G5'].map(gate => 
          getArtifactDefinitionsForInitiative(gate, formType)
        )
      );
      
      const initialArtifacts: ExtendedArtifact[] = allArtifactDefs
        .flat()
        .map((def, index) => ({
          id: `art-${Date.now()}-${def.id}`,
          gate: def.gate,
          name: def.name,
          definitionId: def.id,
          category: def.area || 'Producto',
          version: 'v0.1',
          status: ArtifactStatus.NOT_STARTED,
          artifactType: 'Output' as const,
          destination: ['Confluence'],
          versions: [],
          expanded: false,
          predecessorIds: def.predecessorIds,
          mandatory: def.mandatory
        })) as any;

      const newInitiative: Initiative = {
        id: Date.now().toString(),
        name: formName,
        product: formProduct,
        currentGateId: 'G1', // Iniciativas comienzan en G1 (después del intake/G0)
        artifacts: initialArtifacts,
        intakeRequestId: formData.intakeRequestId || undefined,
        status: 'En curso',
        type: formType, // Change o Run
        pipelineActivated: true // Se activa al crear desde aquí
      };
      
      console.log('📝 Creando iniciativa con tipo:', formType);

      // Guardar en BD
      try {
        await createInitiative(newInitiative);
        console.log('✅ Iniciativa guardada en BD:', newInitiative.id);
        
        // Actualizar estado local
        setInitiative(newInitiative);
        setDbInitiatives(prev => [...prev, newInitiative]);
      } catch (error) {
        console.error('❌ Error guardando iniciativa en BD:', error);
        // Usar localmente aunque falle BD
        setInitiative(newInitiative);
      }
    } else {
      // Modo edit - actualizar iniciativa existente
      if (!initiative) return;
      
      const updatedInitiative = { 
        ...initiative, 
        name: formName, 
        product: formProduct,
        type: formType // ← Actualizar tipo también
      };
      
      // Actualizar en BD (NO crear nueva)
      try {
        await updateInitiative(initiative.id, {
          name: formName,
          product: formProduct,
          type: formType
        });
        console.log('✅ Iniciativa actualizada (NO duplicada) con tipo:', formType);
        
        // Actualizar estado local
        setInitiative(updatedInitiative);
        
        // Actualizar en la lista SIN duplicar
        setDbInitiatives(prev => prev.map(init => 
          init.id === initiative.id ? updatedInitiative : init
        ));
      } catch (error) {
        console.error('❌ Error actualizando iniciativa:', error);
        // Actualizar localmente aunque falle BD
        setInitiative(updatedInitiative);
        setDbInitiatives(prev => prev.map(init => 
          init.id === initiative.id ? updatedInitiative : init
        ));
      }
    }
    setShowModal(false);
    setFormData({});
  };

  const handleOpenConfigModal = (artId: string) => {
    setConfigArtifactId(artId);
    setShowConfigModal(true);
  };

  const handleMarkAsCompleted = async () => {
    if (!initiative || !configArtifactId) return;
    
    const artifact = dynamicArtifacts.find(a => a.id === configArtifactId) as ExtendedArtifact | undefined;
    if (!artifact) return;

    setShowConfigModal(false);

    // Update artifact status to ACTIVE (DONE) without generating a file
    const updatedArtifacts = initiative.artifacts.map(art => {
      if (art.id === configArtifactId) {
        return { 
          ...art, 
          status: ArtifactStatus.ACTIVE,
          versions: undefined
        };
      }
      return { ...art, versions: undefined };
    });

    // If artifact wasn't in initiative.artifacts yet, add it
    const artExistsInInit = initiative.artifacts.some(a => a.id === configArtifactId);
    if (!artExistsInInit) {
      updatedArtifacts.push({
        ...artifact,
        status: ArtifactStatus.ACTIVE,
        versions: undefined
      } as any);
    }

    // Persist to database
    try {
      await updateInitiative(initiative.id, {
        artifacts: updatedArtifacts as any
      });
      console.log('✅ Artefacto marcado como completado (sin archivo)');
    } catch (error) {
      console.error('❌ Error guardando estado:', error);
    }

    // Update local state
    setInitiative(prev => {
      if (!prev) return null;
      return { ...prev, artifacts: updatedArtifacts as any };
    });

    setNotification({ show: true, message: `"${artifact.name}" marcado como completado` });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  const handleGenerateArtifact = async () => {
    if (!initiative || !configArtifactId) return;
    
    const artifact = dynamicArtifacts.find(a => a.id === configArtifactId) as ExtendedArtifact | undefined;
    if (!artifact) return;

    setIsGenerating(true);
    setIsManualEditing(false);
    setActiveArtifactId(configArtifactId);
    setArtifactPreview(null);
    setArtifactPdfBlob(null);
    setShowConfigModal(false); // Cerrar modal al generar

    setInitiative(prev => {
      if (!prev) return null;
      const exists = prev.artifacts.some(a => a.id === configArtifactId);
      if (exists) {
        return {
          ...prev,
          artifacts: prev.artifacts.map(a => a.id === configArtifactId ? { ...a, status: ArtifactStatus.GENERATING } : a)
        };
      } else {
        return {
          ...prev,
          artifacts: [...prev.artifacts, { ...artifact, status: ArtifactStatus.GENERATING }]
        };
      }
    });

    try {
      // 1. Generate content with Gemini AI
      const gateLabel = GATES.find(g => g.id === selectedGateId)?.name || selectedGateId;
      
      // Construir prompt descargando CONTENIDO REAL de archivos
      let promptText = '';
      
      // Información de configuración seleccionada
      const selectedContextFiles = configContext.map(id => libraryFiles.find(f => f.id === id)).filter(Boolean);
      const selectedPromptFile = configPrompt ? libraryFiles.find(f => f.id === configPrompt) : null;
      const selectedTemplateFile = configTemplate ? libraryFiles.find(f => f.id === configTemplate) : null;
      
      console.log('📥 Descargando contenido de archivos seleccionados...');
      
      // DESCARGAR Y USAR CONTENIDO REAL DEL PROMPT
      if (selectedPromptFile) {
        try {
          const blob = await downloadLibraryFile(selectedPromptFile.id);
          const content = await blob.text();
          promptText = `=== INSTRUCCIONES DE PROMPT ===\n${content}\n\n`;
          console.log('✅ Prompt cargado:', selectedPromptFile.name, `(${content.length} caracteres)`);
        } catch (error) {
          console.error('❌ Error descargando prompt:', error);
          promptText = `Generate a professional document for "${artifact.name}" within the "${gateLabel}" gate.\n\n`;
        }
      } else {
        promptText = `Generate a professional document for "${artifact.name}" within the "${gateLabel}" gate of a PDLC for Kashio Fintech.\n\n`;
      }
      
      // DESCARGAR Y USAR CONTENIDO REAL DE CONTEXTO
      if (selectedContextFiles.length > 0) {
        promptText += `\n=== ARCHIVOS DE CONTEXTO ===\n`;
        for (const file of selectedContextFiles) {
          try {
            const blob = await downloadLibraryFile((file as any).id);
            const content = await blob.text();
            promptText += `\n--- ${(file as any).name} ---\n${content}\n`;
            console.log('✅ Contexto cargado:', (file as any).name, `(${content.length} caracteres)`);
          } catch (error) {
            console.error('❌ Error descargando contexto:', (file as any).name);
            promptText += `\n--- ${(file as any).name} ---\n(No disponible)\n`;
          }
        }
        promptText += '\n';
      }
      
      // DESCARGAR Y USAR CONTENIDO REAL DEL TEMPLATE
      if (selectedTemplateFile) {
        try {
          const blob = await downloadLibraryFile(selectedTemplateFile.id);
          const content = await blob.text();
          promptText += `\n=== PLANTILLA DE FORMATO ===\n${content}\n\n`;
          console.log('✅ Template cargado:', selectedTemplateFile.name, `(${content.length} caracteres)`);
        } catch (error) {
          console.error('❌ Error descargando template:', error);
        }
      }
      
      // Añadir contexto del intake si estamos en G0
      if (selectedGateId === 'G0' && intakeData) {
        promptText += `\n=== CONTEXTO DEL INTAKE ===\n- Requester: ${intakeData.requester}\n- Problem: ${intakeData.problem}\n- Outcome: ${intakeData.outcome}\n- Severity: ${intakeData.severity}\n- Product: ${intakeData.product}\n\n`;
      }
      
      // Añadir instrucciones personalizadas del usuario
      if (customPrompt.trim()) {
        promptText += `\n=== INSTRUCCIONES PERSONALIZADAS ===\n${customPrompt}\n\n`;
      }
      
      // Validar longitud del prompt
      const MAX_PROMPT_LENGTH = 100000; // ~100KB límite razonable
      if (promptText.length > MAX_PROMPT_LENGTH) {
        console.warn(`⚠️ Prompt muy largo: ${promptText.length} caracteres. Puede causar problemas.`);
      }

      promptText += `\n\n=== INSTRUCCIÓN FINAL PARA GEMINI ===\n
IMPORTANTE: Debes generar un documento COMPLETO y DETALLADO siguiendo EXACTAMENTE estos pasos:

1. USA LA ESTRUCTURA de la PLANTILLA DE FORMATO que está arriba
   - Copia cada encabezado y sección de la plantilla
   - Mantén la numeración y jerarquía exacta
   
2. LLENA CADA SECCIÓN con información REAL de los ARCHIVOS DE CONTEXTO
   - Usa datos específicos, números, nombres de competidores
   - Cita ejemplos concretos del contexto
   - NO inventes información
   
3. SIGUE LAS INSTRUCCIONES DEL PROMPT de arriba
   - Tono profesional
   - Formato específico requerido
   - Lineamientos de contenido
   
4. GENERA UN DOCUMENTO LARGO Y COMPLETO
   - Mínimo 2,000 palabras
   - Todas las secciones de la plantilla llenas
   - Información detallada en cada sección

5. ESCRIBE EN ESPAÑOL PROFESIONAL
   - Terminología de negocio correcta
   - Sin traducciones literales del inglés

PROHIBIDO:
- ❌ Generar solo un "esquema" o "resumen"
- ❌ Dejar secciones vacías o con "..."
- ❌ Inventar información no presente en contexto
- ❌ Ignorar la estructura de la plantilla

RESULTADO ESPERADO: Documento PRD completo de 2,000+ palabras siguiendo la plantilla exacta con toda la información del contexto.`;

      console.log('📤 Enviando a Gemini:', promptText.length, 'caracteres totales');
      console.log('📋 PRIMEROS 500 CHARS:', promptText.substring(0, 500));
      
      const content = await generateArtifactContent(artifact.name, promptText);

      // Guardar log completo para debugging
      saveGenerationLog({
        artifactName: artifact.name,
        gate: selectedGateId,
        selectedFiles: {
          context: configContext.map(id => libraryFiles.find(f => f.id === id)?.name || id),
          prompt: selectedPromptFile?.name || 'ninguno',
          template: selectedTemplateFile?.name || 'ninguno'
        },
        promptLength: promptText.length,
        fullPrompt: promptText,
        result: content || 'Error: Sin contenido',
        error: content ? undefined : 'No se generó contenido'
      });
      
      console.log('💾 Log guardado - Ver con: getLastGenerationLog()');

      setArtifactPreview(content || 'No se pudo generar el contenido.');

      // 2. Generate PDF from content
      let pdfBlob: Blob | null = null;
      if (content) {
        pdfBlob = await generatePDF(content, {
          title: artifact.name,
          initiativeId: initiative.id,
          artifactId: configArtifactId,
          gate: selectedGateId,
          version: `v${(artifact.versions?.length || 0) + 1}.0-ARIA`,
          generatedBy: 'ARIA',
          author: 'ARIA AI System',
          date: new Date()
        });
        
        setArtifactPdfBlob(pdfBlob);
        console.log('✅ PDF generated successfully:', pdfBlob.size, 'bytes');
      }

      setIsGenerating(false);

      // 3. Add new version to artifact
      const newVersion: DocumentVersion = {
        id: `${configArtifactId}-v${(artifact.versions?.length || 0) + 1}`,
        version: `v${(artifact.versions?.length || 0) + 1}.0`,
        content: content || '',
        pdfBlob: pdfBlob,
        generatedAt: new Date(),
        generatedBy: 'ARIA'
      };

      setInitiative(prev => {
        if (!prev) return null;
        const exists = prev.artifacts.some(a => a.id === configArtifactId);
        const updatedArtifact = {
          ...artifact,
          status: ArtifactStatus.DRAFT,
          version: newVersion.version,
          versions: [...(artifact.versions || []), newVersion],
          link: content ? 'Pendiente de publicar' : undefined
        };
        if (exists) {
          return {
            ...prev,
            artifacts: prev.artifacts.map(a => a.id === configArtifactId ? updatedArtifact : a)
          };
        } else {
          return {
            ...prev,
            artifacts: [...prev.artifacts, updatedArtifact]
          };
        }
      });

      // Guardar el estado actualizado en localStorage (sin blobs para evitar problemas de serialización)
      try {
        if (initiative) {
          const serializableArtifacts = initiative.artifacts.map(a => ({
            ...a,
            versions: undefined // No serializar versiones con blobs
          }));
          // Actualizar el artefacto generado
          const artIndex = serializableArtifacts.findIndex(a => a.id === configArtifactId);
          if (artIndex >= 0) {
            serializableArtifacts[artIndex] = { ...serializableArtifacts[artIndex], status: ArtifactStatus.DRAFT, version: newVersion.version };
          } else {
            serializableArtifacts.push({
              ...artifact,
              status: ArtifactStatus.DRAFT,
              version: newVersion.version,
              versions: undefined
            } as any);
          }
          await updateInitiative(initiative.id, { artifacts: serializableArtifacts as any });
          console.log('💾 Artefacto guardado en localStorage (status: DRAFT)');
        }
      } catch (e) {
        console.error('⚠️ Error guardando artefacto en localStorage:', e);
      }
    } catch (error) {
      console.error('Error generating artifact:', error);
      setArtifactPreview('Error al generar el contenido. Por favor intenta nuevamente.');
      setIsGenerating(false);
      
      setInitiative(prev => {
        if (!prev) return null;
        const exists = prev.artifacts.some(a => a.id === configArtifactId);
        if (exists) {
          return {
            ...prev,
            artifacts: prev.artifacts.map(a => a.id === configArtifactId ? { ...a, status: ArtifactStatus.NOT_STARTED } : a)
          };
        }
        return prev;
      });
    }
  };

  const toggleArtifactExpansion = (artId: string) => {
    setExpandedArtifacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artId)) {
        newSet.delete(artId);
      } else {
        newSet.add(artId);
      }
      return newSet;
    });
  };

  const loadVersion = (version: DocumentVersion) => {
    setArtifactPreview(version.content);
    setArtifactPdfBlob(version.pdfBlob);
    setActiveArtifactId(version.id.split('-v')[0]); // Get artifact ID from version ID
  };

  const filteredPortfolio = useMemo(() => {
    return PORTFOLIO_2026.filter(p => 
      p.name.toLowerCase().includes(searchPortfolio.toLowerCase()) || 
      p.id.toLowerCase().includes(searchPortfolio.toLowerCase())
    ).slice(0, 5);
  }, [searchPortfolio]);

  const filteredIntakes = useMemo(() => {
    // Solo mostrar intakes que NO tienen pipeline activado (están en G0)
    const intakesWithoutPipeline = dbIntakes.filter(intake => {
      // Verificar si ya existe una iniciativa para este intake
      const hasInitiative = dbInitiatives.some(init => 
        init.intakeRequestId === intake.id && init.pipelineActivated
      );
      return !hasInitiative;
    });
    
    return intakesWithoutPipeline.filter(intake => 
      intake.title.toLowerCase().includes(searchPortfolio.toLowerCase()) || 
      intake.id.toLowerCase().includes(searchPortfolio.toLowerCase())
    ).slice(0, 5);
  }, [dbIntakes, dbInitiatives, searchPortfolio]);

  const handleSelectFromIntake = (intake: IntakeRequest) => {
    setFormName(intake.title);
    setFormProduct(intake.product);
    setIntakeData(intake);
    // Marcar que esta iniciativa viene de un intake
    setFormData((prev: any) => ({ ...prev, intakeRequestId: intake.id }));
  };

  const [formData, setFormData] = useState<any>({});

  const getStatusIcon = (status: ArtifactStatus) => {
    switch (status) {
      case ArtifactStatus.GENERATING: return <Loader2 className="animate-spin text-amber-500" size={18} />;
      case ArtifactStatus.DRAFT: return <CheckCircle2 className="text-amber-500" size={18} />;
      case ArtifactStatus.PENDING_HITL: return <UserCheck className="text-amber-600" size={18} />;
      case ArtifactStatus.ACTIVE: return <CheckCircle2 className="text-emerald-600" size={18} />;
      default: return <Clock className="text-slate-300" size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ARIA Generation</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestiona iniciativas y genera artefactos automáticos por Gate.</p>
        </div>
        {!initiative ? (
          <div className="flex space-x-3">
            <button 
              onClick={() => { setModalMode('create'); setShowModal(true); }}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            >
              <Plus size={20} />
              <span>Nueva Iniciativa</span>
            </button>
            {/* Botón oculto - descomentar para limpiar todas las iniciativas (desarrollo)
            {dbInitiatives.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm('⚠️ ¿Eliminar TODAS las iniciativas? Esta acción no se puede deshacer.')) {
                    resetAllInitiatives();
                    setDbInitiatives([]);
                    setInitiative(null);
                    window.location.reload();
                  }
                }}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-red-600 shadow-md transition-all"
                title="⚠️ Solo para desarrollo - Limpia todas las iniciativas"
              >
                <RotateCcw size={16} />
                <span>Limpiar Todo</span>
              </button>
            )}
            */}
          </div>
        ) : (
          <div className="flex space-x-3">
            <button 
               onClick={() => setInitiative(null)}
               className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 shadow-md shadow-amber-200 transition-all"
            >
              <ChevronRight size={18} className="rotate-180" />
              <span>Cambiar Iniciativa</span>
            </button>
          </div>
        )}
      </div>

      {!initiative ? (
        <div className="space-y-6">
          {/* Header sin botón duplicado */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Iniciativas Activas</h2>
            <p className="text-slate-500 mt-1">Selecciona una iniciativa para gestionar sus artefactos</p>
          </div>

          {/* Lista de Iniciativas G1+ de BD */}
          {isLoadingDB ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-slate-600">Cargando iniciativas...</p>
            </div>
          ) : dbInitiatives.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No hay iniciativas en ARIA</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Las iniciativas creadas desde Intake Hub aparecerán aquí cuando pasen a Gate 1
              </p>
              <button 
                onClick={() => { setModalMode('create'); setShowModal(true); }}
                className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                <Wand2 size={20} />
                <span>Activar ARIA Pipeline</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbInitiatives.map(init => (
                <div 
                  key={init.id}
                  onClick={() => setInitiative(init)}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{init.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{init.product}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                        {init.currentGateId}
                      </div>
                      {init.type && (
                        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                          init.type === 'Run' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-purple-50 text-purple-700'
                        }`}>
                          {init.type === 'Run' ? '🔧 Run' : '🚀 Change'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {init.artifacts?.length || 0} artefactos
                    </span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Wand2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Progreso Global del Pipeline</h3>
                  <p className="text-xs text-slate-500 font-medium">Iniciativa: {initiative.name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600">{progressStats.percent}%</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Salud de Generación</p>
              </div>
            </div>
            <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progressStats.percent}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>{progressStats.completed} de {progressStats.total} Artefactos Generados</span>
              <span>{progressStats.total - progressStats.completed} Pendientes</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Initiative Context & Gate Nav */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setModalMode('edit'); setShowModal(true); }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Target size={12} />
                  <span>Iniciativa Activa</span>
                </div>
                <h3 className="text-lg font-bold leading-tight mb-4 pr-6">{initiative.name}</h3>
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Producto:</span>
                    <span className="font-bold">{initiative.product}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Status:</span>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">En curso</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navegación de Gates</h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {GATES.map((gate) => {
                    const isActive = selectedGateId === gate.id;
                    const gateDefs = allGateDefinitions[gate.id];
                    const totalInGate = gateDefs?.total || 0;
                    const mandatoryInGate = gateDefs?.mandatoryCount || 0;
                    const defNames = gateDefs?.names || [];
                    const defIds = gateDefs?.ids || [];
                    
                    // Helper: check if an artifact matches a definition by ID or name (including partial)
                    const findArtForDef = (defName: string, defIdx: number) => {
                      const defId = defIds[defIdx];
                      return initiative.artifacts.find(a => {
                        if (a.gate !== gate.id) return false;
                        const ext = a as any;
                        if (ext.definitionId && ext.definitionId === defId) return true;
                        if (defId && a.id && a.id.includes(defId)) return true;
                        if (a.name === defName) return true;
                        if (a.name && defName && (defName.includes(a.name) || a.name.includes(defName))) return true;
                        return false;
                      });
                    };

                    // Count completed
                    const doneInGate = defNames.filter((name, idx) => {
                      const art = findArtForDef(name, idx);
                      return art && art.status === ArtifactStatus.ACTIVE;
                    }).length;

                    // Count mandatory done
                    const mandatoryDone = defNames.filter((name, idx) => {
                      const art = findArtForDef(name, idx);
                      return art && art.status === ArtifactStatus.ACTIVE;
                    }).length;

                    // Gate is complete when all mandatory artifacts are done
                    const isGateComplete = mandatoryInGate > 0 && doneInGate >= mandatoryInGate;
                    
                    return (
                      <button 
                        key={gate.id}
                        onClick={() => {
                          setSelectedGateId(gate.id);
                          setActiveArtifactId(null);
                          setArtifactPreview(null);
                          setArtifactPdfBlob(null);
                        }}
                        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                          isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isGateComplete ? 'bg-emerald-600 text-white shadow-md' : isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isGateComplete ? '✓' : gate.id}
                          </div>
                          <div>
                            <span className={`text-sm font-bold block ${isGateComplete ? 'text-emerald-700' : isActive ? 'text-indigo-900' : 'text-slate-600'}`}>{gate.name}</span>
                            <span className={`text-[10px] font-medium ${isGateComplete ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {isGateComplete ? 'Completado' : `${doneInGate}/${totalInGate} Listos`}
                            </span>
                          </div>
                        </div>
                        {isActive && <ChevronRight size={16} className="text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Artifact List for selected Gate */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <LayoutGrid size={24} className="mr-3 text-indigo-600" />
                  Artefactos de Gate: <span className="text-indigo-600 ml-2">{selectedGateId}</span>
                </h3>
              </div>

              {/* Gate 0: Mostrar Análisis de IA del Intake */}
              {selectedGateId === 'G0' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-3xl p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-indigo-900">Análisis de ARIA</h4>
                        <p className="text-sm text-indigo-600">Recomendación estratégica para esta iniciativa</p>
                      </div>
                    </div>
                    
                    {intakeData?.ariaAnalysis ? (
                      <div className="bg-white/70 border border-indigo-200 rounded-2xl p-6">
                        <p className="text-slate-800 leading-relaxed text-sm font-medium italic">
                          {intakeData.ariaAnalysis}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/50 border border-indigo-200 rounded-2xl p-6 text-center">
                        <p className="text-slate-500 text-sm italic">
                          No hay análisis de IA disponible. Esta iniciativa puede no haber venido de un intake.
                        </p>
                      </div>
                    )}
                  </div>

                  {intakeData && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Upload size={20} className="text-slate-600" />
                        <h4 className="font-bold text-slate-900">Información del Intake</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-slate-500 font-bold uppercase">ID:</span>
                          <p className="text-slate-900 font-medium">{intakeData.id}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-bold uppercase">Título:</span>
                          <p className="text-slate-900 font-medium">{intakeData.title}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-bold uppercase">Requester:</span>
                          <p className="text-slate-900 font-medium">{intakeData.requester}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-bold uppercase">Severidad:</span>
                          <p className="text-slate-900 font-medium">{intakeData.severity} - {intakeData.urgency}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-bold uppercase">Producto:</span>
                          <p className="text-slate-900 font-medium">{intakeData.product}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-slate-500 font-bold uppercase">Problema:</span>
                          <p className="text-slate-900 font-medium">{intakeData.problem}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-slate-500 font-bold uppercase">Resultado Esperado:</span>
                          <p className="text-slate-900 font-medium">{intakeData.outcome}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Artifacts Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">Artefacto</div>
                  <div className="col-span-2">Categoría</div>
                  <div className="col-span-2">Versión</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-1">Acciones</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                  {isLoadingArtifacts ? (
                    <div className="px-6 py-12 text-center">
                      <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Cargando artefactos del gate...</p>
                    </div>
                  ) : dynamicArtifacts.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-slate-400 text-sm italic">
                        No hay artefactos configurados para este gate y tipo de iniciativa
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Ve a "Config. Artefactos" para agregar artefactos
                      </p>
                    </div>
                  ) : (
                    dynamicArtifacts.map((art) => {
                    const extArt = art as ExtendedArtifact;
                    const isExpanded = expandedArtifacts.has(art.id);
                    const hasVersions = (extArt.versions?.length || 0) > 0;

                    return (
                      <div key={art.id}>
                        {/* Main Row - parent artifact, base level */}
                        <div className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors ${
                          activeArtifactId === art.id ? 'bg-indigo-50' : ''
                        }`}>
                          {/* Expand Button */}
                          <div className="col-span-1">
                            {hasVersions && (
                              <button
                                onClick={() => toggleArtifactExpansion(art.id)}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp size={16} className="text-slate-600" />
                                ) : (
                                  <ChevronDown size={16} className="text-slate-600" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Artifact Name */}
                          <div className="col-span-4 flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              art.status === ArtifactStatus.DRAFT || art.status === ArtifactStatus.ACTIVE 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-slate-800 text-sm">{art.name}</h4>
                                {(art as ExtendedArtifact).description && (
                                  <div className="relative group/help">
                                    <HelpCircle size={14} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200 w-64 z-50 pointer-events-none">
                                      {(art as ExtendedArtifact).description}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                    </div>
                                  </div>
                                )}
                                {(art as ExtendedArtifact).mandatory ? (
                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-100 text-red-600 rounded tracking-wider uppercase">Obligatorio</span>
                                ) : (
                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded tracking-wider uppercase">Opcional</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">{art.artifactType}</span>
                            </div>
                          </div>

                          {/* Category / Area */}
                          <div className="col-span-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              art.category === 'Comercial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              art.category === 'Tecnología' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                              art.category === 'Negocio' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              art.category === 'Operaciones' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                              art.category === 'Customer' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                              art.category === 'Finanzas' ? 'bg-lime-50 text-lime-700 border-lime-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>{art.category}</span>
                          </div>

                          {/* Version */}
                          <div className="col-span-2">
                            <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {art.version}
                            </span>
                            {hasVersions && (
                              <span className="ml-2 text-xs text-slate-500">
                                ({extArt.versions?.length} {extArt.versions?.length === 1 ? 'versión' : 'versiones'})
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(art.status)}
                              <span className={`text-xs font-bold capitalize ${
                                art.status === ArtifactStatus.ACTIVE ? 'text-emerald-600' :
                                art.status === ArtifactStatus.DRAFT ? 'text-amber-600' :
                                'text-slate-500'
                              }`}>
                                {art.status === ArtifactStatus.ACTIVE ? 'DONE' :
                                 art.status === ArtifactStatus.NOT_STARTED ? 'NOT STARTED' :
                                 art.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <button 
                              onClick={() => handleOpenConfigModal(art.id)}
                              disabled={isGenerating}
                              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                art.status === ArtifactStatus.NOT_STARTED 
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Configurar y generar"
                            >
                              {art.status === ArtifactStatus.NOT_STARTED ? (
                                <Settings size={16} />
                              ) : (
                                <RotateCcw size={16} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Published Artifact Versions - indented as children of the artifact */}
                        {(art.publishedFiles || []).length > 0 && (() => {
                          const pubFiles = art.publishedFiles || [];
                          const isOpen = expandedPublished.has(art.id);
                          const versionCount = pubFiles.length;
                          const latestFile = pubFiles[pubFiles.length - 1];
                          return (
                            <div className="ml-16 pl-6 pr-6 pb-3 border-l-2 border-emerald-200">
                              {/* Toggle Header - latest version summary */}
                              <button
                                onClick={() => {
                                  setExpandedPublished(prev => {
                                    const next = new Set(prev);
                                    if (next.has(art.id)) next.delete(art.id);
                                    else next.add(art.id);
                                    return next;
                                  });
                                }}
                                className="w-full py-2 px-4 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl transition-colors flex items-center justify-between group/toggle"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-5 h-5 bg-emerald-200 rounded flex items-center justify-center shrink-0">
                                    <FileCheck size={12} className="text-emerald-700" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[11px] font-bold text-emerald-800 truncate max-w-md">
                                      {latestFile.filename || `${art.name.replace(/\s+/g, '_')}_${latestFile.version}.md`}
                                    </p>
                                    <p className="text-[9px] text-emerald-600 mt-0.5">
                                      {latestFile.publishedBy || 'ARIA AI'} &bull; {latestFile.version}
                                      {latestFile.publishedAt && ` \u2022 ${new Date(latestFile.publishedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                                      <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[8px] font-bold">ÚLTIMA</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    {versionCount} {versionCount === 1 ? 'versión' : 'versiones'}
                                  </span>
                                  {isOpen ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-emerald-500" />}
                                </div>
                              </button>

                              {/* Expanded Version List - each file as a child row */}
                              {isOpen && (
                                <div className="mt-1.5 ml-4 border-l-2 border-emerald-200 pl-4 space-y-1.5">
                                  {[...pubFiles].reverse().map((pf, pfIdx) => (
                                    <div key={pfIdx} className={`flex items-center justify-between py-2 px-3 rounded-lg ${pfIdx === 0 ? 'bg-emerald-50/80' : 'bg-slate-50/80'}`}>
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${pfIdx === 0 ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                                          <FileCheck size={10} className={pfIdx === 0 ? 'text-emerald-700' : 'text-slate-500'} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className={`text-[10px] font-bold truncate ${pfIdx === 0 ? 'text-emerald-800' : 'text-slate-500'}`}>
                                            {pf.filename || `${art.name.replace(/\s+/g, '_')}_${pf.version}.md`}
                                          </p>
                                          <p className="text-[9px] text-slate-400">
                                            {pf.publishedBy || 'ARIA AI'} &bull; {pf.version}
                                            {pf.publishedAt && ` \u2022 ${new Date(pf.publishedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                                            {pfIdx === 0 && <span className="ml-1 px-1 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[7px] font-bold">ÚLTIMA</span>}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-1 shrink-0 ml-3">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const fn = pf.filename || `${art.name.replace(/\s+/g, '_')}_${pf.version}.md`;
                                            try {
                                              const resp = await fetch(`/api/library/download/${encodeURIComponent(fn)}`);
                                              if (!resp.ok) throw new Error('No encontrado');
                                              const { signedUrl } = await resp.json();
                                              const fileResp = await fetch(signedUrl);
                                              if (!fileResp.ok) throw new Error('Error descargando');
                                              const blob = await fileResp.blob();
                                              const content = await blob.text();
                                              setActiveArtifactId(art.id);
                                              setArtifactPreview(content);
                                              setArtifactPdfBlob(null);
                                            } catch (err) {
                                              console.error('Error cargando artefacto:', err);
                                              setNotification({show: true, message: 'No se pudo cargar el artefacto del bucket'});
                                              setTimeout(() => setNotification({show: false, message: ''}), 3000);
                                            }
                                          }}
                                          className="flex items-center space-x-1 px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded text-[9px] font-bold hover:bg-emerald-50 transition-colors"
                                          title="Ver contenido"
                                        >
                                          <Eye size={10} />
                                          <span>Ver</span>
                                        </button>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const fn = pf.filename || `${art.name.replace(/\s+/g, '_')}_${pf.version}.md`;
                                            try {
                                              const resp = await fetch(`/api/library/download/${encodeURIComponent(fn)}`);
                                              if (!resp.ok) throw new Error('No encontrado');
                                              const { signedUrl } = await resp.json();
                                              const fileResp = await fetch(signedUrl);
                                              if (!fileResp.ok) throw new Error('Error descargando');
                                              const blob = await fileResp.blob();
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = fn;
                                              document.body.appendChild(a);
                                              a.click();
                                              window.URL.revokeObjectURL(url);
                                              document.body.removeChild(a);
                                            } catch (err) {
                                              console.error('Error descargando artefacto:', err);
                                              setNotification({show: true, message: 'No se pudo descargar el artefacto'});
                                              setTimeout(() => setNotification({show: false, message: ''}), 3000);
                                            }
                                          }}
                                          className="flex items-center space-x-1 px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700 transition-colors"
                                          title="Descargar archivo"
                                        >
                                          <Download size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {/* Fallback for ACTIVE artifacts without publishedFiles (legacy) */}
                        {art.status === ArtifactStatus.ACTIVE && (!art.publishedFiles || art.publishedFiles.length === 0) && (
                          <div className="ml-16 pl-6 pr-6 pb-3 border-l-2 border-emerald-200">
                            <div className="flex items-center space-x-3 py-2 px-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <div className="w-5 h-5 bg-emerald-200 rounded flex items-center justify-center shrink-0">
                                <FileCheck size={12} className="text-emerald-700" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-emerald-800">
                                  {art.name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').replace(/\s+/g, '_')}_{(initiative?.name || '').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').replace(/\s+/g, '_')}_v1.0.md
                                </p>
                                <p className="text-[9px] text-emerald-600 mt-0.5">
                                  Publicado por ARIA AI &bull; {art.version}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expanded Versions */}
                        {isExpanded && hasVersions && (
                          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <div className="ml-12 space-y-2">
                              <h5 className="text-xs font-bold text-slate-600 uppercase mb-3">
                                Historial de Versiones
                              </h5>
                              {extArt.versions?.map((version, idx) => (
                                <div 
                                  key={version.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                                >
                                  <div className="flex items-center space-x-4">
                                    <FileCheck size={16} className="text-emerald-600" />
                                    <div>
                                      <span className="text-sm font-mono text-slate-700">{version.version}</span>
                                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center space-x-1">
                                          <Calendar size={12} />
                                          <span>{typeof version.generatedAt === 'string' ? version.generatedAt : version.generatedAt?.toLocaleDateString?.('es-ES') || ''}</span>
                                        </span>
                                        <span>•</span>
                                        <span>{version.generatedBy}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => loadVersion(version)}
                                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                    >
                                      <Eye size={14} className="inline mr-1" />
                                      Ver
                                    </button>
                                    {version.pdfBlob && (
                                      <button
                                        onClick={() => downloadPDF(version.pdfBlob!, `${art.name}_${version.version}.pdf`)}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                      >
                                        <Download size={14} className="inline mr-1" />
                                        PDF
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                  )}
                </div>
              </div>

              {/* Preview Box - Solo se muestra si hay preview activo */}
              {(activeArtifactId || artifactPreview) && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8 animate-in slide-in-from-bottom-8">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {initiative.artifacts.find(a => a.id === activeArtifactId)?.name}
                        </h4>
                        <p className="text-xs text-slate-500">Borrador generado por ARIA Engine</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => {
                          setActiveArtifactId(null);
                          setArtifactPreview(null);
                          setArtifactPdfBlob(null);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                        title="Cerrar preview"
                      >
                        <X size={20} />
                      </button>
                      {!isGenerating && (
                        <>
                          {!isManualEditing ? (
                            <button 
                              onClick={() => setIsManualEditing(true)}
                              className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white shadow-sm transition-all"
                            >
                              <Edit2 size={14} />
                              <span>Editar Manualmente</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => setIsManualEditing(false)}
                              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
                            >
                              <Save size={14} />
                              <span>Guardar Cambios</span>
                            </button>
                          )}
                          
                          {/* PDF Actions */}
                          {artifactPdfBlob && (
                            <>
                              <button 
                                onClick={() => previewPDF(artifactPdfBlob)}
                                className="flex items-center space-x-2 px-4 py-2 border border-amber-200 bg-amber-50 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-100 shadow-sm transition-all"
                                title="Preview PDF en nueva pestaña"
                              >
                                <Eye size={14} />
                                <span>Preview PDF</span>
                              </button>
                              
                              <button 
                                onClick={() => {
                                  const artifact = initiative?.artifacts.find(a => a.id === activeArtifactId);
                                  const filename = `${selectedGateId}_${artifact?.name.replace(/\s+/g, '_')}_${artifact?.version}.pdf`;
                                  downloadPDF(artifactPdfBlob, filename);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 shadow-sm transition-all"
                                title="Descargar PDF"
                              >
                                <Download size={14} />
                                <span>Descargar PDF</span>
                              </button>
                            </>
                          )}
                          
                          <button 
                            onClick={async () => {
                              if (!activeArtifactId || !initiative || !artifactPreview) {
                                console.error('❌ Faltan datos para publicar:', { activeArtifactId, hasInitiative: !!initiative, hasPreview: !!artifactPreview });
                                setNotification({show: true, message: 'Error: No hay contenido para publicar'});
                                setTimeout(() => setNotification({show: false, message: ''}), 3000);
                                return;
                              }

                              const currentArtifact = dynamicArtifacts.find(a => a.id === activeArtifactId) || 
                                                      initiative.artifacts.find(a => a.id === activeArtifactId);
                              
                              if (!currentArtifact) {
                                console.error('❌ Artefacto no encontrado:', activeArtifactId);
                                return;
                              }

                              // Calcular siguiente versión basada en publishedFiles existentes
                              const existingPublished = currentArtifact.publishedFiles || [];
                              const nextVersionNum = existingPublished.length + 1;
                              const nextVersion = `v${nextVersionNum}.0`;

                              console.log('🚀 Publicando artefacto:', currentArtifact.name, 'versión:', nextVersion);
                              setNotification({show: true, message: `Publicando ${currentArtifact.name} ${nextVersion}...`});

                              let bucketUrl = '';
                              let publishedFilename = '';
                              let publishedAt = new Date().toISOString();

                              // 1. Subir contenido de texto al bucket
                              try {
                                const publishResult = await publishArtifactContent({
                                  initiativeId: initiative.id,
                                  initiativeName: initiative.name,
                                  artifactName: currentArtifact.name,
                                  gate: selectedGateId,
                                  version: nextVersion,
                                  content: artifactPreview
                                });
                                bucketUrl = publishResult.url;
                                publishedFilename = publishResult.filename || `${publishResult.fileId}.md`;
                                publishedAt = publishResult.publishedAt || publishedAt;
                                console.log('✅ Contenido publicado al bucket:', bucketUrl);
                              } catch (error) {
                                console.error('❌ Error subiendo contenido al bucket:', error);
                                setNotification({show: true, message: 'Error al subir contenido al bucket. Guardando localmente...'});
                              }

                              // 2. Subir PDF al bucket si existe
                              if (artifactPdfBlob) {
                                try {
                                  await publishArtifactPdf({
                                    initiativeName: initiative.name,
                                    artifactName: currentArtifact.name,
                                    gate: selectedGateId,
                                    version: nextVersion,
                                    pdfBlob: artifactPdfBlob
                                  });
                                  console.log('✅ PDF publicado al bucket');
                                } catch (error) {
                                  console.error('⚠️ Error subiendo PDF al bucket (no crítico):', error);
                                }
                              }

                              // 3. Construir nuevo publishedFile entry
                              const newPublishedFile = {
                                version: nextVersion,
                                filename: publishedFilename,
                                url: bucketUrl || 'Publicado localmente',
                                publishedAt,
                                publishedBy: 'ARIA AI'
                              };

                              // 4. Actualizar estado del artefacto a ACTIVE en la iniciativa
                              const updatedArtifacts = initiative.artifacts.map(art => {
                                if (art.id === activeArtifactId) {
                                  return { 
                                    ...art, 
                                    status: ArtifactStatus.ACTIVE,
                                    version: nextVersion,
                                    link: bucketUrl || 'Publicado localmente',
                                    publishedFiles: [...(art.publishedFiles || []), newPublishedFile],
                                    versions: undefined
                                  };
                                }
                                return { ...art, versions: undefined };
                              });

                              // Si el artefacto no estaba en initiative.artifacts, agregarlo
                              const artExistsInInit = initiative.artifacts.some(a => a.id === activeArtifactId);
                              if (!artExistsInInit) {
                                updatedArtifacts.push({
                                  ...currentArtifact,
                                  status: ArtifactStatus.ACTIVE,
                                  version: nextVersion,
                                  link: bucketUrl || 'Publicado localmente',
                                  publishedFiles: [newPublishedFile],
                                  versions: undefined
                                } as any);
                              }

                              // 5. Persistir en localStorage
                              try {
                                await updateInitiative(initiative.id, {
                                  artifacts: updatedArtifacts as any
                                });
                                console.log('✅ Iniciativa actualizada en localStorage con artefacto ACTIVE');
                              } catch (error) {
                                console.error('❌ Error guardando en localStorage:', error);
                              }

                              // 6. Actualizar estado React
                              const updatedInitiative = {
                                ...initiative,
                                artifacts: updatedArtifacts as any
                              };
                              setInitiative(updatedInitiative);
                              setDbInitiatives(prev => prev.map(init => 
                                init.id === initiative.id ? updatedInitiative : init
                              ));

                              // 7. Limpiar preview
                              setActiveArtifactId(null);
                              setArtifactPreview(null);
                              setArtifactPdfBlob(null);

                              setNotification({show: true, message: `Artefacto "${currentArtifact.name}" ${nextVersion} publicado exitosamente`});
                              setTimeout(() => setNotification({show: false, message: ''}), 4000);
                            }}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
                          >
                            Publicar Artefacto
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-8 min-h-[300px]">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                          <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                        </div>
                        <p className="text-sm font-bold text-indigo-600 animate-pulse">Analizando contexto y redactando borrador...</p>
                      </div>
                    ) : artifactPreview ? (
                      <div className="prose prose-slate max-w-none">
                        {isManualEditing ? (
                          <textarea 
                            className="w-full min-h-[400px] p-8 font-mono text-sm text-slate-700 leading-relaxed bg-white border-2 border-indigo-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50"
                            value={artifactPreview}
                            onChange={(e) => setArtifactPreview(e.target.value)}
                          />
                        ) : (
                          <div className="bg-white p-8 rounded-2xl border border-slate-100 prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-h1:text-2xl prose-h1:font-extrabold prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-3 prose-h2:text-xl prose-h2:font-bold prose-h3:text-base prose-h3:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-800 prose-table:border-collapse prose-th:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-bold prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2 prose-td:text-xs prose-li:text-slate-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-indigo-700 prose-code:text-xs prose-hr:border-slate-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {artifactPreview}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Create/Edit Initiative Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-40 flex items-center justify-center p-4 overflow-y-auto">
          {/* Sin backdrop - modal limpia */}
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex">
            {/* Left side: Portfolio Selection */}
            {modalMode === 'create' && (
              <div className="w-1/2 bg-slate-50 p-8 border-r border-slate-100 overflow-y-auto max-h-[600px]">
                <div className="flex items-center space-x-2 mb-6">
                  <Target size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Elegir del Portafolio</h3>
                </div>
                
                <div className="relative mb-6">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar iniciativa..."
                    value={searchPortfolio}
                    onChange={(e) => setSearchPortfolio(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Intakes de BD (G0) */}
                {filteredIntakes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Desde Intake Hub (G0)
                    </h4>
                    <div className="space-y-2">
                      {filteredIntakes.map(intake => {
                        const isSelected = formName === intake.title;
                        return (
                          <button 
                            key={intake.id}
                            onClick={() => handleSelectFromIntake(intake)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                              isSelected 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                                {intake.id} • {intake.type}
                              </span>
                              {isSelected && <Check size={14} />}
                            </div>
                            <p className="text-sm font-bold leading-tight">{intake.title}</p>
                            <p className={`text-[9px] mt-1 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                              Por: {intake.requester} • {intake.product}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Portafolio */}
                {filteredPortfolio.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                      Portfolio 2026
                    </h4>
                    <div className="space-y-2">
                      {filteredPortfolio.map(p => {
                        const isSelected = formName === p.name;
                        return (
                          <button 
                            key={p.id}
                            onClick={() => handleSelectFromPortfolio(p)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-slate-100 hover:border-indigo-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {p.id}
                              </span>
                              {isSelected && <Check size={14} />}
                            </div>
                            <p className="text-xs font-bold leading-tight">{p.name}</p>
                            <p className={`text-[9px] mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                              Squad: {p.squads} • Lead: {p.lead}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {filteredIntakes.length === 0 && filteredPortfolio.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No se encontraron iniciativas</p>
                    <p className="text-xs text-slate-400 mt-1">Intenta otra búsqueda o crea una nueva</p>
                  </div>
                )}
              </div>
            )}

            {/* Right side: Manual Config */}
            <div className={`p-8 ${modalMode === 'create' ? 'w-1/2' : 'w-full'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {modalMode === 'create' ? 'Configurar Pipeline' : 'Editar Iniciativa'}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Confirma los datos para activar el motor generativo ARIA.
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre del Proyecto</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nombre de la iniciativa..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Producto Kashio</label>
                  <SearchableSelect
                    value={formProduct}
                    onChange={(val) => setFormProduct(val)}
                    options={[
                      { value: 'Conexión Única', label: 'Conexión Única' },
                      { value: 'Kashio Cards', label: 'Kashio Cards' },
                      { value: 'Recaudación V2', label: 'Recaudación V2' },
                      { value: 'Checkout API', label: 'Checkout API' },
                      { value: 'KLedger Core', label: 'KLedger Core' }
                    ]}
                    placeholder="Seleccionar producto..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Iniciativa</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormType('Run')}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 text-left ${
                        formType === 'Run'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-black mb-1">🔧 Run</div>
                      <div className="text-[11px] font-normal leading-tight opacity-75">Mantenimiento estándar (campo, fix, bug)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('Change')}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 text-left ${
                        formType === 'Change'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-black mb-1">🚀 Change</div>
                      <div className="text-[11px] font-normal leading-tight opacity-75">Nueva funcionalidad (proyecto completo)</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-700">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase">Capacidades ARIA</span>
                  </div>
                  <ul className="text-[11px] text-indigo-900/70 font-medium space-y-1.5">
                    <li className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                      <span>Generación automática de BRM & Fichas</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                      <span>Sincronización con Confluence/Jira</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateOrUpdateInitiative}
                  disabled={!formName}
                  className="py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {modalMode === 'create' ? 'Activar Pipeline' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal for Generation - Sin backdrop, scrolleable */}
      {showConfigModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex justify-center py-8 overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-slate-200 animate-in zoom-in-95 duration-200" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="p-8 overflow-y-auto" style={{maxHeight: 'calc(100vh - 8rem)'}}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Configurar Generación</h2>
                    <p className="text-slate-500 text-sm mt-1">
                      {initiative?.artifacts.find(a => a.id === configArtifactId)?.name}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfigModal(false)} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Context Files */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                    <Upload size={12} />
                    <span>Archivos de Contexto (Información de Entrada) - Múltiple</span>
                  </label>
                  <SearchableSelect
                    value=""
                    onChange={(val) => {
                      if (val && !configContext.includes(val)) {
                        setConfigContext(prev => [...prev, val]);
                      }
                    }}
                    options={contextFiles.map(file => ({ value: file.id, label: file.name }))}
                    placeholder={isLoadingLibrary ? 'Cargando archivos...' : contextFiles.length === 0 ? 'No hay archivos de contexto' : 'Seleccionar archivo de contexto...'}
                    disabled={isLoadingLibrary}
                  />
                  {configContext.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {configContext.map((fileId, idx) => {
                        const file = libraryFiles.find(f => f.id === fileId);
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <span className="text-xs text-indigo-700 font-medium">{file?.name || fileId}</span>
                            <button
                              onClick={() => setConfigContext(prev => prev.filter((_, i) => i !== idx))}
                              className="text-indigo-400 hover:text-indigo-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                    <Wand2 size={12} />
                    <span>Archivo de Prompt (Instrucciones) - Solo Uno</span>
                  </label>
                  <SearchableSelect
                    value={configPrompt}
                    onChange={(val) => setConfigPrompt(val)}
                    options={[
                      { value: '', label: 'Sin prompt seleccionado' },
                      ...promptFiles.map(file => ({ value: file.id, label: file.name }))
                    ]}
                    placeholder={isLoadingLibrary ? 'Cargando prompts...' : promptFiles.length === 0 ? 'No hay prompts disponibles' : 'Seleccionar prompt...'}
                    disabled={isLoadingLibrary}
                  />
                  {configPrompt && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-purple-700 font-medium">
                        {libraryFiles.find(f => f.id === configPrompt)?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Template */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                    <FileText size={12} />
                    <span>Plantilla de Salida (Formato) - Solo Una</span>
                  </label>
                  <SearchableSelect
                    value={configTemplate}
                    onChange={(val) => setConfigTemplate(val)}
                    options={[
                      { value: '', label: 'Sin plantilla seleccionada' },
                      ...templateFiles.map(file => ({ value: file.id, label: file.name }))
                    ]}
                    placeholder={isLoadingLibrary ? 'Cargando templates...' : templateFiles.length === 0 ? 'No hay templates disponibles' : 'Seleccionar template...'}
                    disabled={isLoadingLibrary}
                  />
                  {configTemplate && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 font-medium">
                        {libraryFiles.find(f => f.id === configTemplate)?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Custom Prompt / Instructions */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                    <Sparkles size={12} />
                    <span>Instrucciones Personalizadas (Opcional)</span>
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ej: Enfócate en la arquitectura técnica y las integraciones con sistemas legacy. Incluye diagrams de flujo..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[120px] resize-y font-medium"
                  />
                  <p className="text-xs text-slate-500 mt-2 italic">
                    Instrucciones adicionales que ARIA seguirá al generar el documento
                  </p>
                </div>

                {/* Instructions Summary */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Resumen de Configuración
                  </label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-500 font-medium min-w-[140px]">Archivos Contexto:</span>
                      <span className="text-slate-700 font-bold">
                        {configContext.length > 0 ? `${configContext.length} archivo(s) seleccionado(s)` : 'Ninguno'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-500 font-medium min-w-[140px]">Prompt:</span>
                      <span className="text-slate-700 font-bold">
                        {configPrompt ? libraryFiles.find(f => f.id === configPrompt)?.name || 'Seleccionado' : 'Ninguno'}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-500 font-medium min-w-[140px]">Template:</span>
                      <span className="text-slate-700 font-bold">
                        {configTemplate ? libraryFiles.find(f => f.id === configTemplate)?.name || 'Seleccionado' : 'Ninguno'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 italic">
                    ARIA usará este prompt + archivos de contexto + formato de templates
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="py-3 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleMarkAsCompleted}
                  className="py-3 px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Completar sin Generar</span>
                </button>
                <button 
                  onClick={handleGenerateArtifact}
                  disabled={isGenerating}
                  className="py-3 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles size={18} />
                  <span>Generar Documento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center space-x-3">
            <CheckCircle2 size={20} />
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification({show: false, message: ''})}
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

export default Generation;
