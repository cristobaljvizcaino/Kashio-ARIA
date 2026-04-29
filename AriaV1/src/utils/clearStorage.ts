/**
 * Utility para limpiar localStorage y comenzar desde cero
 */

export const clearAllStorage = () => {
  try {
    // Limpiar todos los datos de ARIA en localStorage
    localStorage.removeItem('aria_intake_requests');
    localStorage.removeItem('aria_initiatives');
    localStorage.removeItem('aria_artifacts');
    
    console.log('✅ LocalStorage limpiado completamente');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando storage:', error);
    return false;
  }
};

export const getStorageStats = () => {
  const intakes = localStorage.getItem('aria_intake_requests');
  const initiatives = localStorage.getItem('aria_initiatives');
  const artifacts = localStorage.getItem('aria_artifacts');
  
  return {
    intakes: intakes ? JSON.parse(intakes).length : 0,
    initiatives: initiatives ? JSON.parse(initiatives).length : 0,
    artifacts: artifacts ? JSON.parse(artifacts).length : 0
  };
};

