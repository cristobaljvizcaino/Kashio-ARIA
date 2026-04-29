/**
 * Cloud Functions for ARIA Library
 * 
 * Handles file operations for aria-library-files bucket
 */

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({ origin: true });

const storage = new Storage();
const BUCKET_NAME = 'aria-library-files';
const bucket = storage.bucket(BUCKET_NAME);

/**
 * Get all library files with metadata
 */
functions.http('getLibraryFiles', (req, res) => {
  cors(req, res, async () => {
    try {
      console.log('📚 Fetching library files');

      const [files] = await bucket.getFiles();
      
      const fileList = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata();
          const pathParts = file.name.split('/');
          const category = pathParts[0]; // Contexto, Output, Prompt, Template
          const filename = pathParts[pathParts.length - 1];
          
          return {
            id: filename,
            name: filename.replace(/^lib-\d+-/, ''), // Remove timestamp prefix
            category,
            uploadedAt: metadata.timeCreated,
            size: parseInt(metadata.size) || 0,
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
      const { filename, category, contentType } = req.body;

      if (!filename || !category) {
        return res.status(400).json({ error: 'filename and category are required' });
      }

      // Generate unique file ID with timestamp
      const timestamp = Date.now();
      const fileId = `lib-${timestamp}-${filename}`;
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
        filePath
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
      const fileId = req.params[0].replace('/downloadLibraryFile/', '');
      
      if (!fileId) {
        return res.status(400).json({ error: 'fileId is required' });
      }

      console.log(`⬇️ Downloading file: ${fileId}`);

      // Search for file in all categories
      const [files] = await bucket.getFiles();
      const file = files.find(f => f.name.includes(fileId));

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      console.log('✅ Download URL generated');
      res.status(200).json({ signedUrl });

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
      const fileId = req.params[0].replace('/deleteLibraryFile/', '');
      
      if (!fileId) {
        return res.status(400).json({ error: 'fileId is required' });
      }

      console.log(`🗑️ Deleting file: ${fileId}`);

      // Search for file in all categories
      const [files] = await bucket.getFiles();
      const file = files.find(f => f.name.includes(fileId));

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      await file.delete();

      console.log('✅ File deleted');
      res.status(200).json({ success: true });

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

