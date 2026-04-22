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

export const resetAllIntakes = () => {
  try {
    localStorage.removeItem('aria_intake_requests');
    console.log('🧹 Todos los intakes eliminados');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando intakes:', error);
    return false;
  }
};

export const resetAllArtifacts = () => {
  try {
    localStorage.removeItem('aria_artifacts');
    console.log('🧹 Todos los artefactos eliminados');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando artefactos:', error);
    return false;
  }
};

export const resetEverything = () => {
  try {
    localStorage.removeItem('aria_initiatives');
    localStorage.removeItem('aria_intake_requests');
    localStorage.removeItem('aria_artifacts');
    console.log('🧹✅ TODOS LOS DATOS ELIMINADOS - Sistema limpio');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
    return false;
  }
};

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).resetAllInitiatives = resetAllInitiatives;
  (window as any).resetAllIntakes = resetAllIntakes;
  (window as any).resetAllArtifacts = resetAllArtifacts;
  (window as any).resetEverything = resetEverything;
}

