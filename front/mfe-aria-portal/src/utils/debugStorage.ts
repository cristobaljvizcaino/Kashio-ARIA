/**
 * Debug utility para ver qué hay almacenado
 */

export const debugStorage = () => {
  console.log('🔍 ======================');
  console.log('🔍 DEBUG STORAGE');
  console.log('🔍 ======================');
  
  // LocalStorage
  const intakesRaw = localStorage.getItem('aria_intake_requests');
  const initiativesRaw = localStorage.getItem('aria_initiatives');
  const artifactsRaw = localStorage.getItem('aria_artifacts');
  
  const intakes = intakesRaw ? JSON.parse(intakesRaw) : [];
  const initiatives = initiativesRaw ? JSON.parse(initiativesRaw) : [];
  const artifacts = artifactsRaw ? JSON.parse(artifactsRaw) : [];
  
  console.log('📦 LocalStorage:');
  console.log('  - Intakes:', intakes.length, intakes.map((i: any) => i.title || i.id));
  console.log('  - Initiatives:', initiatives.length, initiatives.map((i: any) => i.name || i.id));
  console.log('  - Artifacts:', artifacts.length);
  
  console.log('🔍 ======================');
  
  return {
    intakes,
    initiatives,
    artifacts
  };
};

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).debugStorage = debugStorage;
}

