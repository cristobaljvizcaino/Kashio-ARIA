/**
 * Reset Database - Utilidad para limpiar datos y comenzar desde cero
 */

export const resetAllInitiatives = () => {
  try {
    localStorage.removeItem('aria_initiatives');
    console.log('🧹 Todas las iniciativas eliminadas');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando iniciativas:', error);
    return false;
  }
};

if (typeof window !== 'undefined') {
  (window as any).resetAllInitiatives = resetAllInitiatives;
}
