import type { LibraryCategory } from '../const/categories';

export interface LibraryFileItem {
  id: string;
  name: string;
  category: LibraryCategory | string;
  uploadedAt: string | undefined;
  size: number;
  url: string;
  contentType: string;
  initiativeName: string;
  artifactName: string;
  gate: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
}

export interface UploadUrlInput {
  filename: string;
  category: string;
  contentType?: string;
}

export interface UploadUrlResult {
  signedUrl: string;
  fileId: string;
  filePath: string;
}

export interface PublishArtifactInput {
  initiativeId?: string;
  initiativeName?: string;
  artifactName: string;
  gate?: string;
  version?: string;
  content: string;
  contentType?: string;
}

export interface PublishArtifactResult {
  success: true;
  fileId: string;
  filePath: string;
  filename: string;
  url: string;
  version: string;
  publishedAt: string;
  size: number;
}

export interface PublishPdfHeaders {
  initiativename?: string;
  artifactname?: string;
  gate?: string;
  version?: string;
}
