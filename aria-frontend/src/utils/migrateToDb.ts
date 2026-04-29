/**
 * One-time migration: localStorage → PostgreSQL
 * 
 * Checks if there's data in localStorage that isn't yet in the database,
 * and pushes it to the server API. Runs once per browser session.
 */

const MIGRATION_KEY = 'aria_migration_done_v2';

export async function migrateLocalStorageToDb(): Promise<void> {
  // Only run once per browser
  if (sessionStorage.getItem(MIGRATION_KEY)) return;
  sessionStorage.setItem(MIGRATION_KEY, 'true');

  console.log('🔄 [Migration] Checking for localStorage data to migrate...');

  try {
    // Migrate initiatives
    const localInitiatives = getLocal('aria_initiatives');
    if (localInitiatives.length > 0) {
      const dbInitiatives = await fetchJson('/api/db/initiatives');
      const dbIds = new Set(dbInitiatives.map((i: any) => i.id));
      
      let migratedCount = 0;
      for (const init of localInitiatives) {
        if (!dbIds.has(init.id)) {
          try {
            await postJson('/api/db/initiatives', init);
            migratedCount++;
            console.log(`  ✅ Migrated initiative: ${init.name}`);
          } catch (e: any) {
            console.error(`  ❌ Failed to migrate initiative ${init.id}:`, e.message);
          }
        }
      }
      if (migratedCount > 0) {
        console.log(`🔄 [Migration] Migrated ${migratedCount} initiatives`);
      }
    }

    // Migrate artifact definitions
    const localDefs = getLocal('aria_artifact_definitions');
    if (localDefs.length > 0) {
      const dbDefs = await fetchJson('/api/db/artifact-definitions');
      const dbIds = new Set(dbDefs.map((d: any) => d.id));
      
      let migratedCount = 0;
      for (const def of localDefs) {
        if (!dbIds.has(def.id)) {
          try {
            await postJson('/api/db/artifact-definitions', def);
            migratedCount++;
          } catch (e: any) {
            console.error(`  ❌ Failed to migrate definition ${def.id}:`, e.message);
          }
        }
      }
      if (migratedCount > 0) {
        console.log(`🔄 [Migration] Migrated ${migratedCount} artifact definitions`);
      }
    }

    console.log('✅ [Migration] Complete');
  } catch (error) {
    console.error('❌ [Migration] Error:', error);
  }
}

function getLocal(key: string): any[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function fetchJson(url: string): Promise<any[]> {
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}

async function postJson(url: string, data: any): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`POST failed: ${response.status}`);
  }
  return response.json();
}
