/**
 * Generation Logger - Guardar logs de generación para debugging
 */

interface GenerationLog {
  timestamp: string;
  artifactName: string;
  gate: string;
  selectedFiles: {
    context: string[];
    prompt: string;
    template: string;
  };
  promptLength: number;
  fullPrompt: string;
  result: string;
  error?: string;
}

const STORAGE_KEY = 'aria_generation_logs';
const MAX_LOGS = 10; // Mantener solo los últimos 10

export const saveGenerationLog = (log: Omit<GenerationLog, 'timestamp'>) => {
  try {
    const logs = getGenerationLogs();
    const newLog: GenerationLog = {
      ...log,
      timestamp: new Date().toISOString()
    };
    
    logs.unshift(newLog);
    
    // Mantener solo los últimos MAX_LOGS
    const trimmed = logs.slice(0, MAX_LOGS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log('📝 Log de generación guardado:', newLog.artifactName);
    
    return true;
  } catch (error) {
    console.error('❌ Error guardando log:', error);
    return false;
  }
};

export const getGenerationLogs = (): GenerationLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Error cargando logs:', error);
    return [];
  }
};

export const getLastGenerationLog = (): GenerationLog | null => {
  const logs = getGenerationLogs();
  return logs.length > 0 ? logs[0] : null;
};

export const clearGenerationLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🧹 Logs de generación limpiados');
};

// Exportar para uso en console
if (typeof window !== 'undefined') {
  (window as any).getGenerationLogs = getGenerationLogs;
  (window as any).getLastGenerationLog = getLastGenerationLog;
  (window as any).clearGenerationLogs = clearGenerationLogs;
}

