import type { File } from '@google-cloud/storage';
import { bucket, bucketName } from '../config/storage';
import { isLibraryCategory } from '../const/categories';
import { SIGNED_URL_TTL_MS } from '../const/storage';
import { HttpError } from '../types/http';
import type { LibraryFileItem, UploadUrlInput, UploadUrlResult } from '../types/library';
import { sanitizeFileName } from '../utils/sanitize';

interface CustomMeta {
  initiativeName?: string;
  artifactName?: string;
  gate?: string;
  version?: string;
  publishedAt?: string;
  publishedBy?: string;
}

/** Lista archivos del bucket con dedupe de versiones para outputs `.md`. */
export async function listFiles(): Promise<LibraryFileItem[]> {
  const [files] = await bucket.getFiles();

  const sourceFiles = files.filter((file) => !file.name.startsWith('Output/'));
  const outputFiles = files.filter(
    (file) => file.name.startsWith('Output/') && file.name.endsWith('.md'),
  );

  const outputByBase: Record<string, File[]> = {};
  for (const file of outputFiles) {
    const filename = file.name.split('/').pop() ?? file.name;
    const baseName = filename.replace(/_v\d+\.\d+\.md$/, '');
    (outputByBase[baseName] ??= []).push(file);
  }

  const latestOutputFiles: File[] = [];
  for (const versions of Object.values(outputByBase)) {
    versions.sort((a, b) => extractVersionScore(b.name) - extractVersionScore(a.name));
    if (versions[0]) latestOutputFiles.push(versions[0]);
  }

  const allFiles = [...sourceFiles, ...latestOutputFiles];

  return Promise.all(
    allFiles.map(async (file): Promise<LibraryFileItem> => {
      const [metadata] = await file.getMetadata();
      const pathParts = file.name.split('/');
      const isOutput = file.name.startsWith('Output/');
      const category = isOutput ? 'Output' : pathParts[0] ?? '';
      const filename = pathParts[pathParts.length - 1] ?? file.name;

      const customMeta: CustomMeta = (metadata.metadata ?? {}) as CustomMeta;
      return {
        id: filename,
        name: isOutput ? filename : filename.replace(/^lib-\d+-/, ''),
        category,
        uploadedAt: typeof metadata.timeCreated === 'string' ? metadata.timeCreated : undefined,
        size: parseInt(String(metadata.size ?? 0), 10) || 0,
        url: `gs://${bucketName}/${file.name}`,
        contentType: metadata.contentType || 'application/octet-stream',
        initiativeName: customMeta.initiativeName ?? '',
        artifactName: customMeta.artifactName ?? '',
        gate: customMeta.gate ?? '',
        version: customMeta.version ?? '',
        publishedAt: customMeta.publishedAt ?? '',
        publishedBy: customMeta.publishedBy ?? '',
      };
    }),
  );
}

export async function createUploadUrl(input: UploadUrlInput): Promise<UploadUrlResult> {
  const { filename, category, contentType } = input;

  if (!filename || !category) {
    throw new HttpError(400, 'filename and category are required');
  }
  if (!isLibraryCategory(category)) {
    throw new HttpError(400, 'Invalid category', {
      allowedCategories: ['Contexto', 'Output', 'Prompt', 'Template'],
    });
  }

  const safeFilename = sanitizeFileName(filename);
  const fileId = `lib-${Date.now()}-${safeFilename}`;
  const filePath = `${category}/${fileId}`;

  const [signedUrl] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + SIGNED_URL_TTL_MS,
    contentType: contentType || 'application/octet-stream',
  });

  return { signedUrl, fileId, filePath };
}

export async function createDownloadUrl(fileId: string): Promise<{ signedUrl: string }> {
  if (!fileId) throw new HttpError(400, 'fileId is required');

  const [files] = await bucket.getFiles();
  const file = files.find((f) => f.name.includes(fileId));
  if (!file) throw new HttpError(404, 'File not found');

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + SIGNED_URL_TTL_MS,
  });

  return { signedUrl };
}

export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId) throw new HttpError(400, 'fileId is required');

  const [files] = await bucket.getFiles();
  const file = files.find((f) => f.name.includes(fileId));
  if (!file) throw new HttpError(404, 'File not found');

  await file.delete();
}

function extractVersionScore(name: string): number {
  const match = name.match(/_v(\d+)\.(\d+)\.md$/);
  if (!match) return 0;
  const major = parseInt(match[1] ?? '0', 10);
  const minor = parseInt(match[2] ?? '0', 10);
  return major * 100 + minor;
}
