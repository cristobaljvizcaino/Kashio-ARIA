/**
 * Cloud Functions for ARIA Library
 * 
 * Handles file operations for the library GCS bucket (default: karia-library-files; override GCS_BUCKET_NAME)
 */

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({
  origin: [
    'https://karia-ui-app-476648227615.us-east4.run.app',
    'http://localhost:3000',
    'http://localhost:8082'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
});

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'karia-library-files';
const bucket = storage.bucket(BUCKET_NAME);

function sanitizeFileName(filename) {
  return String(filename)
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, '_')
    .trim();
}

function isAllowedCategory(category) {
  return ['Contexto', 'Output', 'Prompt', 'Template'].includes(category);
}

/**
 * Get all library files with metadata
 */
functions.http('getLibraryFiles', (req, res) => {
  cors(req, res, async () => {
    try {
      console.log('📚 Fetching library files');

      const category = req.query.category;

      if (category && !isAllowedCategory(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          allowedCategories: ['Contexto', 'Output', 'Prompt', 'Template']
        });
      }

      const options = category ? { prefix: `${category}/` } : {};
      const [files] = await bucket.getFiles(options);
      
      const fileList = await Promise.all(
        files
          .filter(file => !file.name.endsWith('/'))
          .map(async (file) => {
            const [metadata] = await file.getMetadata();
            const pathParts = file.name.split('/');
            const fileCategory = pathParts[0];
            const filename = pathParts[pathParts.length - 1];
          
            return {
              id: filename,
              filePath: file.name,
              name: filename.replace(/^lib-\d+-/, ''),
              category: fileCategory,
              uploadedAt: metadata.timeCreated,
              updatedAt: metadata.updated,
              size: parseInt(metadata.size, 10) || 0,
              url: `gs://${BUCKET_NAME}/${file.name}`,
              contentType: metadata.contentType || 'application/octet-stream'
            };
          })
      );

      console.log(`✅ Found ${fileList.length} files`);
      res.status(200).json(fileList);

    } catch (error) {
      console.error('❌ Error fetching files:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get signed URL for uploading a new file
 */
functions.http('getLibraryUploadUrl', (req, res) => {
  cors(req, res, async () => {
    try {
      const { filename, category, contentType } = req.body || {};

      if (!filename || !category) {
        return res.status(400).json({ error: 'filename and category are required' });
      }

      if (!isAllowedCategory(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          allowedCategories: ['Contexto', 'Output', 'Prompt', 'Template']
        });
      }

      const safeFilename = sanitizeFileName(filename);
      const timestamp = Date.now();
      const fileId = `lib-${timestamp}-${safeFilename}`;
      const filePath = `${category}/${fileId}`;

      console.log(`📤 Generating upload URL for: ${filePath}`);

      const file = bucket.file(filePath);
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType || 'application/octet-stream'
      });

      console.log('✅ Upload URL generated');
      res.status(200).json({
        signedUrl,
        fileId,
        filePath,
        bucket: BUCKET_NAME,
        expiresInMinutes: 15
      });

    } catch (error) {
      console.error('❌ Error generating upload URL:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Download a library file
 */
functions.http('downloadLibraryFile', (req, res) => {
  cors(req, res, async () => {
    try {
      const filePath = req.query.filePath || req.body?.filePath;

      if (!filePath) {
        return res.status(400).json({ error: 'filePath is required' });
      }

      console.log(`⬇️ Downloading file: ${filePath}`);

      const file = bucket.file(filePath);
      const [exists] = await file.exists();

      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000
      });

      console.log('✅ Download URL generated');
      res.status(200).json({ signedUrl, filePath, expiresInMinutes: 15 });

    } catch (error) {
      console.error('❌ Error downloading file:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Delete a library file
 */
functions.http('deleteLibraryFile', (req, res) => {
  cors(req, res, async () => {
    try {
      const filePath = req.query.filePath || req.body?.filePath;

      if (!filePath) {
        return res.status(400).json({ error: 'filePath is required' });
      }

      console.log(`🗑️ Deleting file: ${filePath}`);

      const file = bucket.file(filePath);
      const [exists] = await file.exists();

      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }

      await file.delete();

      console.log('✅ File deleted');
      res.status(200).json({ success: true, filePath });

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

