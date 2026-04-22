/**
 * Cloud Storage Service for ARIA
 * 
 * Handles upload, download, and management of generated artifacts
 * in Google Cloud Storage buckets.
 */

import { Storage } from '@google-cloud/storage';

// Initialize Cloud Storage client
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'kashio-squad-nova'
});

// Bucket names
const BUCKETS = {
  ARTIFACTS: 'kashio-aria-artifacts',
  TEMPLATES: 'kashio-aria-templates'
} as const;

/**
 * Upload an artifact file to Cloud Storage
 * 
 * @param file - File to upload
 * @param initiativeId - Initiative ID
 * @param artifactId - Artifact ID
 * @param version - Version (semver)
 * @returns Public URL or signed URL
 */
export async function uploadArtifact(
  file: Blob | File,
  initiativeId: string,
  artifactId: string,
  version: string
): Promise<string> {
  const fileName = `${initiativeId}/${artifactId}/v${version}.pdf`;
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  const fileHandle = bucket.file(fileName);

  // Convert Blob to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload file
  await fileHandle.save(buffer, {
    metadata: {
      contentType: file.type || 'application/pdf',
      metadata: {
        initiativeId,
        artifactId,
        version,
        uploadedAt: new Date().toISOString(),
        generatedBy: 'ARIA'
      }
    }
  });

  // Generate signed URL (valid for 1 hour)
  const [url] = await fileHandle.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000 // 1 hour
  });

  return url;
}

/**
 * Download an artifact from Cloud Storage
 * 
 * @param initiativeId - Initiative ID
 * @param artifactId - Artifact ID
 * @param version - Version
 * @returns File buffer
 */
export async function downloadArtifact(
  initiativeId: string,
  artifactId: string,
  version: string
): Promise<Buffer> {
  const fileName = `${initiativeId}/${artifactId}/v${version}.pdf`;
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  const [buffer] = await bucket.file(fileName).download();
  return buffer;
}

/**
 * Get signed URL for direct access to artifact
 * 
 * @param initiativeId - Initiative ID
 * @param artifactId - Artifact ID
 * @param version - Version
 * @param expiresIn - Expiration time in milliseconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getArtifactSignedUrl(
  initiativeId: string,
  artifactId: string,
  version: string,
  expiresIn: number = 60 * 60 * 1000
): Promise<string> {
  const fileName = `${initiativeId}/${artifactId}/v${version}.pdf`;
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresIn
  });
  return url;
}

/**
 * List all artifacts for an initiative
 * 
 * @param initiativeId - Initiative ID
 * @returns Array of file names
 */
export async function listArtifacts(initiativeId: string): Promise<string[]> {
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  const [files] = await bucket.getFiles({
    prefix: `${initiativeId}/`
  });
  return files.map(file => file.name);
}

/**
 * Delete an artifact
 * 
 * @param initiativeId - Initiative ID
 * @param artifactId - Artifact ID  
 * @param version - Version
 */
export async function deleteArtifact(
  initiativeId: string,
  artifactId: string,
  version: string
): Promise<void> {
  const fileName = `${initiativeId}/${artifactId}/v${version}.pdf`;
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  await bucket.file(fileName).delete();
}

/**
 * Upload a template to templates bucket
 * 
 * @param file - Template file
 * @param templateName - Name of the template
 * @returns Public URL
 */
export async function uploadTemplate(
  file: Blob | File,
  templateName: string
): Promise<string> {
  const bucket = storage.bucket(BUCKETS.TEMPLATES);
  const fileHandle = bucket.file(`templates/${templateName}`);

  const buffer = Buffer.from(await file.arrayBuffer());

  await fileHandle.save(buffer, {
    metadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000' // 1 year
    }
  });

  // Make template publicly readable
  await fileHandle.makePublic();

  return `https://storage.googleapis.com/${BUCKETS.TEMPLATES}/templates/${templateName}`;
}

/**
 * Get artifact metadata
 * 
 * @param initiativeId - Initiative ID
 * @param artifactId - Artifact ID
 * @param version - Version
 * @returns Metadata object
 */
export async function getArtifactMetadata(
  initiativeId: string,
  artifactId: string,
  version: string
): Promise<any> {
  const fileName = `${initiativeId}/${artifactId}/v${version}.pdf`;
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  const [metadata] = await bucket.file(fileName).getMetadata();
  return metadata;
}

/**
 * Check if artifact exists
 * 
 * @param initiativeId - Initiative ID
 * @param artifactId - Artifact ID
 * @param version - Version
 * @returns True if exists
 */
export async function artifactExists(
  initiativeId: string,
  artifactId: string,
  version: string
): Promise<boolean> {
  const fileName = `${initiativeId}/${artifactId}/v${version}.pdf`;
  const bucket = storage.bucket(BUCKETS.ARTIFACTS);
  const [exists] = await bucket.file(fileName).exists();
  return exists;
}

// Browser-compatible version (using fetch)
export const storageServiceBrowser = {
  /**
   * Upload artifact using signed URL (from backend)
   */
  async uploadArtifactViaBrowser(
    signedUrl: string,
    file: Blob | File
  ): Promise<void> {
    await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/pdf'
      }
    });
  },

  /**
   * Download artifact using signed URL
   */
  async downloadArtifactViaBrowser(signedUrl: string): Promise<Blob> {
    const response = await fetch(signedUrl);
    return await response.blob();
  }
};

export default {
  uploadArtifact,
  downloadArtifact,
  getArtifactSignedUrl,
  listArtifacts,
  deleteArtifact,
  uploadTemplate,
  getArtifactMetadata,
  artifactExists,
  browser: storageServiceBrowser
};

