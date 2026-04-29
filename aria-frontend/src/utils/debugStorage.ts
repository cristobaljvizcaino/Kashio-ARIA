/**
 * Debug utility para ver qué hay almacenado
 */

export const debugStorage = () => {
  console.log('🔍 ======================');
  console.log('🔍 DEBUG STORAGE');
  console.log('🔍 ======================');
  
  const initiativesRaw = localStorage.getItem('aria_initiatives');
  const initiatives = initiativesRaw ? JSON.parse(initiativesRaw) : [];
  
  console.log('📦 LocalStorage:');
  console.log('  - Initiatives:', initiatives.length, initiatives.map((i: any) => i.name || i.id));
  
  console.log('🔍 ======================');
  
  return { initiatives };
};

if (typeof window !== 'undefined') {
  (window as any).debugStorage = debugStorage;
}
