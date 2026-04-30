import { bucket, bucketName } from '../config/storage';
import { DEFAULT_OUTPUT_GATE, OUTPUT_PREFIX } from '../const/storage';
import { HttpError } from '../types/http';
import type {
  PublishArtifactInput,
  PublishArtifactResult,
  PublishPdfHeaders,
} from '../types/library';
import { safeSlug, safeVersion } from '../utils/sanitize';

export async function listOutputFilenames(): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix: OUTPUT_PREFIX });
  return files
    .map((file) => file.name.split('/').pop() ?? '')
    .filter((name): name is string => Boolean(name));
}

export async function publishMarkdown(input: PublishArtifactInput): Promise<PublishArtifactResult> {
  const { initiativeId, initiativeName, artifactName, gate, version, content, contentType } = input;

  if (!artifactName || !content) {
    throw new HttpError(400, 'artifactName and content are required');
  }

  const safeName = safeSlug(artifactName, { allowAccents: true });
  const safeInitName = safeSlug(initiativeName || 'sin-iniciativa', { allowAccents: true });
  const versionTag = safeVersion(version || 'v1.0');
  const fileId = `${safeName}_${safeInitName}_${versionTag}`;
  const filePath = `${OUTPUT_PREFIX}${gate || DEFAULT_OUTPUT_GATE}/${fileId}.md`;

  const publishedAt = new Date().toISOString();
  await bucket.file(filePath).save(content, {
    contentType: contentType || 'text/markdown; charset=utf-8',
    metadata: {
      metadata: {
        initiativeId: initiativeId || '',
        initiativeName: initiativeName || '',
        artifactName,
        gate: gate || '',
        version: versionTag || 'v1.0',
        publishedAt,
        publishedBy: 'ARIA',
      },
    },
  });

  return {
    success: true,
    fileId,
    filePath,
    filename: `${fileId}.md`,
    url: `gs://${bucketName}/${filePath}`,
    version: versionTag || 'v1.0',
    publishedAt,
    size: Buffer.byteLength(content, 'utf8'),
  };
}

export async function publishPdf(
  headers: PublishPdfHeaders,
  body: Buffer,
): Promise<{ success: true; fileId: string; filePath: string; url: string }> {
  const { initiativename, artifactname, gate, version } = headers;

  if (!artifactname) {
    throw new HttpError(400, 'artifactname header is required');
  }

  const safeName = safeSlug(artifactname);
  const safeInitName = safeSlug(initiativename || 'sin-iniciativa');
  const versionTag = safeVersion(version || 'v1.0');
  const fileId = `${safeName}_${safeInitName}_${versionTag}`;
  const filePath = `${OUTPUT_PREFIX}${gate || DEFAULT_OUTPUT_GATE}/${fileId}.pdf`;

  await bucket.file(filePath).save(body, {
    contentType: 'application/pdf',
    metadata: {
      metadata: {
        artifactName: artifactname,
        gate: gate || '',
        version: versionTag || 'v1.0',
        publishedAt: new Date().toISOString(),
      },
    },
  });

  return {
    success: true,
    fileId,
    filePath,
    url: `gs://${bucketName}/${filePath}`,
  };
}
