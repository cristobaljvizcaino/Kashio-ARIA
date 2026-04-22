/**
 * Library Service - ARIA
 * 
 * Servicio para gestionar archivos de la Librería de Fuentes
 * Bucket: aria-library-files
 */

export interface LibraryFile {
  id: string;
  name: string;
  category: 'Contexto' | 'Output' | 'Prompt' | 'Template';
  uploadedAt: string;
  size: number;
  url: string;
  contentType: string;
  gate?: number; // 0, 1, 2, 3, 4, 5
  flow?: 'Run' | 'Change' | 'Both'; // Run = mantenimiento, Change = nueva funcionalidad
  active?: boolean; // Si está activo o no
  description?: string; // Descripción del archivo
}

// API Base URL - Same domain API
const API_BASE_URL = '/api/library';
const BUCKET_NAME = 'aria-library-files';

/**
 * Listar todos los archivos de la Librería de Fuentes
 */
export async function getAllLibraryFiles(): Promise<LibraryFile[]> {
  console.log('📚 [Library] Fetching all library files');
  
  try {
    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Library] Fetched library files:', data.length);
    return data;
    
  } catch (error: any) {
    console.error('❌ [Library] Error fetching library files:', error);
    // Fallback: retornar array vacío
    return [];
  }
}

/**
 * Obtener archivos por categoría
 */
export async function getFilesByCategory(category: 'Contexto' | 'Output' | 'Prompt' | 'Template'): Promise<LibraryFile[]> {
  const allFiles = await getAllLibraryFiles();
  return allFiles.filter(file => file.category === category);
}

/**
 * Solicitar URL firmada para upload
 */
export async function getUploadSignedUrl(
  filename: string,
  category: 'Contexto' | 'Output' | 'Prompt' | 'Template',
  contentType: string
): Promise<{ signedUrl: string; fileId: string }> {
  console.log('📤 [Library] Requesting upload URL for:', filename);
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename,
        category,
        contentType
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Library] Upload URL generated');
    return data;
    
  } catch (error: any) {
    console.error('❌ [Library] Error generating upload URL:', error);
    throw error;
  }
}

/**
 * Upload archivo usando signed URL
 */
export async function uploadFileToLibrary(
  signedUrl: string,
  file: File
): Promise<void> {
  console.log('⬆️ [Library] Uploading file:', file.name);
  
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    console.log('✅ [Library] File uploaded successfully');
    
  } catch (error: any) {
    console.error('❌ [Library] Upload error:', error);
    throw error;
  }
}

/**
 * Flujo completo de upload
 */
export async function uploadNewFile(
  file: File,
  category: 'Contexto' | 'Output' | 'Prompt' | 'Template'
): Promise<LibraryFile> {
  // 1. Solicitar signed URL
  const { signedUrl, fileId } = await getUploadSignedUrl(
    file.name,
    category,
    file.type
  );
  
  // 2. Upload el archivo
  await uploadFileToLibrary(signedUrl, file);
  
  // 3. Retornar info del archivo subido
  return {
    id: fileId,
    name: file.name,
    category,
    uploadedAt: new Date().toISOString(),
    size: file.size,
    url: `gs://${BUCKET_NAME}/${category}/${fileId}`,
    contentType: file.type
  };
}

/**
 * Descargar archivo de la librería
 */
export async function downloadLibraryFile(fileId: string): Promise<Blob> {
  console.log('⬇️ [Library] Downloading file:', fileId);
  
  try {
    // Get signed URL from API
    const response = await fetch(`${API_BASE_URL}/download/${fileId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const { signedUrl } = await response.json();
    
    // Download from signed URL
    const fileResponse = await fetch(signedUrl);
    if (!fileResponse.ok) {
      throw new Error(`Download from signed URL failed: ${fileResponse.status}`);
    }
    
    const blob = await fileResponse.blob();
    console.log('✅ [Library] File downloaded');
    return blob;
    
  } catch (error: any) {
    console.error('❌ [Library] Download error:', error);
    throw error;
  }
}

/**
 * Eliminar archivo de la librería
 */
export async function deleteLibraryFile(fileId: string): Promise<void> {
  console.log('🗑️ [Library] Deleting file:', fileId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/delete/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    console.log('✅ [Library] File deleted');
    
  } catch (error: any) {
    console.error('❌ [Library] Delete error:', error);
    throw error;
  }
}

/**
 * Actualizar metadatos de archivo
 */
export async function updateLibraryFileMetadata(
  fileId: string,
  metadata: {
    name?: string;
    gate?: number;
    flow?: 'Run' | 'Change' | 'Both';
    active?: boolean;
    description?: string;
  }
): Promise<void> {
  console.log('📝 [Library] Actualizando metadatos:', fileId);
  
  try {
    // Por ahora guardar en localStorage
    // TODO: Cuando haya backend, enviar a API
    const METADATA_KEY = 'aria_library_metadata';
    const stored = localStorage.getItem(METADATA_KEY);
    const allMetadata = stored ? JSON.parse(stored) : {};
    
    allMetadata[fileId] = {
      ...allMetadata[fileId],
      ...metadata,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(METADATA_KEY, JSON.stringify(allMetadata));
    console.log('✅ [Library] Metadatos actualizados');
    
  } catch (error: any) {
    console.error('❌ [Library] Error actualizando metadatos:', error);
    throw error;
  }
}

/**
 * Obtener metadatos de un archivo
 */
export function getLibraryFileMetadata(fileId: string): Partial<LibraryFile> {
  const METADATA_KEY = 'aria_library_metadata';
  const stored = localStorage.getItem(METADATA_KEY);
  const allMetadata = stored ? JSON.parse(stored) : {};
  return allMetadata[fileId] || {};
}

/**
 * Publicar artefacto generado al bucket
 */
export async function publishArtifactContent(params: {
  initiativeId: string;
  initiativeName: string;
  artifactName: string;
  gate: string;
  version: string;
  content: string;
}): Promise<{ success: boolean; url: string; fileId: string; filename: string; version: string; publishedAt: string }> {
  console.log('📤 [Library] Publishing artifact:', params.artifactName);
  
  try {
    const response = await fetch('/api/artifacts/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Publish failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Library] Artifact published to bucket:', data.url);
    return data;
    
  } catch (error: any) {
    console.error('❌ [Library] Error publishing artifact:', error);
    throw error;
  }
}

/**
 * Publicar PDF del artefacto al bucket
 */
export async function publishArtifactPdf(params: {
  initiativeName: string;
  artifactName: string;
  gate: string;
  version: string;
  pdfBlob: Blob;
}): Promise<{ success: boolean; url: string; fileId: string }> {
  console.log('📤 [Library] Publishing artifact PDF:', params.artifactName);
  
  try {
    const arrayBuffer = await params.pdfBlob.arrayBuffer();
    
    const response = await fetch('/api/artifacts/publish-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'initiativename': params.initiativeName,
        'artifactname': params.artifactName,
        'gate': params.gate,
        'version': params.version
      },
      body: arrayBuffer
    });

    if (!response.ok) {
      throw new Error(`PDF publish failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Library] Artifact PDF published:', data.url);
    return data;
    
  } catch (error: any) {
    console.error('❌ [Library] Error publishing artifact PDF:', error);
    throw error;
  }
}

export default {
  getAllLibraryFiles,
  getFilesByCategory,
  uploadNewFile,
  downloadLibraryFile,
  deleteLibraryFile,
  updateLibraryFileMetadata,
  getLibraryFileMetadata,
  publishArtifactContent,
  publishArtifactPdf
};

