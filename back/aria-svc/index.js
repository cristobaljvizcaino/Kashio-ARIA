/**
 * Express Server for ARIA
 * Serves static React app + API endpoints for Library
 */

const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { query, testConnection, getPool } = require('./db');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Cloud Storage
const storage = new Storage();
const BUCKET_NAME = 'aria-library-files';
const bucket = storage.bucket(BUCKET_NAME);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Routes for Library
app.get('/api/library/files', async (req, res) => {
  try {
    console.log('📚 Fetching library files');
    const [files] = await bucket.getFiles();
    
    // Source files (Contexto, Prompt, Template)
    const sourceFiles = files.filter(file => !file.name.startsWith('Output/'));
    
    // Output files: only .md, keep only latest version per artifact name
    const outputFiles = files.filter(file => 
      file.name.startsWith('Output/') && file.name.endsWith('.md')
    );
    
    // Group output files by artifact base name to find latest version
    const outputByBase = {};
    for (const file of outputFiles) {
      const filename = file.name.split('/').pop();
      // Extract base name: remove version suffix like _v1.0, _v2.0
      const baseName = filename.replace(/_v\d+\.\d+\.md$/, '');
      if (!outputByBase[baseName]) {
        outputByBase[baseName] = [];
      }
      outputByBase[baseName].push(file);
    }
    
    // Keep only the latest version per artifact
    const latestOutputFiles = [];
    for (const [baseName, versions] of Object.entries(outputByBase)) {
      // Sort by version number descending
      versions.sort((a, b) => {
        const getVersion = (f) => {
          const match = f.name.match(/_v(\d+)\.(\d+)\.md$/);
          return match ? parseInt(match[1]) * 100 + parseInt(match[2]) : 0;
        };
        return getVersion(b) - getVersion(a);
      });
      latestOutputFiles.push(versions[0]); // Latest version
    }
    
    const allFiles = [...sourceFiles, ...latestOutputFiles];
    
    const fileList = await Promise.all(
      allFiles.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const pathParts = file.name.split('/');
        const isOutput = file.name.startsWith('Output/');
        const category = isOutput ? 'Output' : pathParts[0];
        const filename = pathParts[pathParts.length - 1];
        
        const customMeta = metadata.metadata || {};
        return {
          id: filename,
          name: isOutput ? filename : filename.replace(/^lib-\d+-/, ''),
          category,
          uploadedAt: metadata.timeCreated,
          size: parseInt(metadata.size) || 0,
          url: `gs://${BUCKET_NAME}/${file.name}`,
          contentType: metadata.contentType || 'application/octet-stream',
          initiativeName: customMeta.initiativeName || '',
          artifactName: customMeta.artifactName || '',
          gate: customMeta.gate || '',
          version: customMeta.version || '',
          publishedAt: customMeta.publishedAt || '',
          publishedBy: customMeta.publishedBy || ''
        };
      })
    );

    console.log(`✅ Found ${fileList.length} library files (${latestOutputFiles.length} output artifacts included)`);
    res.json(fileList);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List artifact files in Output/ folder
app.get('/api/artifacts/files', async (req, res) => {
  try {
    const [files] = await bucket.getFiles({ prefix: 'Output/' });
    const filenames = files.map(f => {
      const parts = f.name.split('/');
      return parts[parts.length - 1];
    }).filter(Boolean);
    console.log(`✅ Found ${filenames.length} artifact files in Output/`);
    res.json(filenames);
  } catch (error) {
    console.error('❌ Error listing artifact files:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/library/upload-url', async (req, res) => {
  try {
    const { filename, category, contentType } = req.body;
    
    if (!filename || !category) {
      return res.status(400).json({ error: 'filename and category required' });
    }

    const timestamp = Date.now();
    const fileId = `lib-${timestamp}-${filename}`;
    const filePath = `${category}/${fileId}`;
    
    const file = bucket.file(filePath);
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType || 'application/octet-stream'
    });

    res.json({ signedUrl, fileId, filePath });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/library/download/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const [files] = await bucket.getFiles();
    const file = files.find(f => f.name.includes(fileId));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000
    });

    res.json({ signedUrl });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/library/delete/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const [files] = await bucket.getFiles();
    const file = files.find(f => f.name.includes(fileId));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await file.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Publish artifact - save content directly to bucket
app.post('/api/artifacts/publish', async (req, res) => {
  try {
    const { initiativeId, initiativeName, artifactName, gate, version, content, contentType } = req.body;

    if (!artifactName || !content) {
      return res.status(400).json({ error: 'artifactName and content required' });
    }

    const safeName = artifactName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').replace(/\s+/g, '_');
    const safeInitName = (initiativeName || 'sin-iniciativa').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '').replace(/\s+/g, '_');
    const safeVersion = (version || 'v1.0').replace(/[^a-zA-Z0-9._]/g, '');
    const fileId = `${safeName}_${safeInitName}_${safeVersion}`;
    const filePath = `Output/${gate || 'G0'}/${fileId}.md`;

    console.log('📄 Publishing artifact to:', filePath);

    const publishedAt = new Date().toISOString();
    const file = bucket.file(filePath);
    await file.save(content, {
      contentType: contentType || 'text/markdown; charset=utf-8',
      metadata: {
        initiativeId: initiativeId || '',
        initiativeName: initiativeName || '',
        artifactName: artifactName || '',
        gate: gate || '',
        version: version || 'v1.0',
        publishedAt,
        publishedBy: 'ARIA'
      }
    });

    const publicUrl = `gs://${BUCKET_NAME}/${filePath}`;
    console.log('✅ Artifact published:', publicUrl);

    res.json({
      success: true,
      fileId,
      filePath,
      filename: `${fileId}.md`,
      url: publicUrl,
      version: version || 'v1.0',
      publishedAt,
      size: Buffer.byteLength(content, 'utf8')
    });
  } catch (error) {
    console.error('❌ Error publishing artifact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Publish artifact PDF to bucket
app.post('/api/artifacts/publish-pdf', express.raw({ type: 'application/pdf', limit: '50mb' }), async (req, res) => {
  try {
    const { initiativename, artifactname, gate, version } = req.headers;

    if (!artifactname) {
      return res.status(400).json({ error: 'artifactname header required' });
    }

    const safeName = (artifactname || '').replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
    const safeInitName = (initiativename || 'sin-iniciativa').replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
    const safeVersion = (version || 'v1.0').replace(/[^a-zA-Z0-9._]/g, '');
    const fileId = `${safeName}_${safeInitName}_${safeVersion}`;
    const filePath = `Output/${gate || 'G0'}/${fileId}.pdf`;

    console.log('📄 Publishing artifact PDF to:', filePath);

    const file = bucket.file(filePath);
    await file.save(req.body, {
      contentType: 'application/pdf',
      metadata: {
        artifactName: artifactname || '',
        gate: gate || '',
        version: version || 'v1.0',
        publishedAt: new Date().toISOString()
      }
    });

    const publicUrl = `gs://${BUCKET_NAME}/${filePath}`;
    console.log('✅ Artifact PDF published:', publicUrl);

    res.json({
      success: true,
      fileId,
      filePath,
      url: publicUrl
    });
  } catch (error) {
    console.error('❌ Error publishing artifact PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// DATABASE API ROUTES
// ========================================

// Health check for database
app.get('/api/db/health', async (req, res) => {
  const result = await testConnection();
  res.json(result);
});

// --- INITIATIVES ---

app.get('/api/db/initiatives', async (req, res) => {
  try {
    const result = await query('SELECT * FROM initiative ORDER BY created_at DESC');
    const initiatives = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      product: row.product,
      currentGateId: row.current_gate_id,
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      quarter: row.quarter,
      status: row.status,
      intakeRequestId: row.intake_request_id,
      pipelineActivated: row.pipeline_activated,
      artifacts: row.artifacts || []
    }));
    console.log(`✅ [API] Fetched ${initiatives.length} initiatives`);
    res.json(initiatives);
  } catch (error) {
    console.error('❌ [API] Error fetching initiatives:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/db/initiatives', async (req, res) => {
  try {
    const init = req.body;
    const result = await query(
      `INSERT INTO initiative (id, name, product, current_gate_id, type, start_date, end_date, quarter, status, intake_request_id, pipeline_activated, artifacts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [init.id, init.name, init.product, init.currentGateId || 'G0', init.type,
       init.startDate, init.endDate, init.quarter, init.status,
       init.intakeRequestId, init.pipelineActivated || false,
       JSON.stringify(init.artifacts || [])]
    );
    const row = result.rows[0];
    console.log('✅ [API] Initiative created:', row.id);
    res.json({
      id: row.id, name: row.name, product: row.product,
      currentGateId: row.current_gate_id, type: row.type,
      startDate: row.start_date, endDate: row.end_date,
      quarter: row.quarter, status: row.status,
      intakeRequestId: row.intake_request_id,
      pipelineActivated: row.pipeline_activated,
      artifacts: row.artifacts || []
    });
  } catch (error) {
    console.error('❌ [API] Error creating initiative:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/db/initiatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIdx = 1;
    
    const fieldMap = {
      name: 'name', product: 'product', currentGateId: 'current_gate_id',
      type: 'type', startDate: 'start_date', endDate: 'end_date',
      quarter: 'quarter', status: 'status', intakeRequestId: 'intake_request_id',
      pipelineActivated: 'pipeline_activated'
    };
    
    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updates[jsKey] !== undefined) {
        setClauses.push(`${dbKey} = $${paramIdx}`);
        values.push(updates[jsKey]);
        paramIdx++;
      }
    }
    
    if (updates.artifacts !== undefined) {
      setClauses.push(`artifacts = $${paramIdx}`);
      values.push(JSON.stringify(updates.artifacts));
      paramIdx++;
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const result = await query(
      `UPDATE initiative SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Initiative not found' });
    }
    
    const row = result.rows[0];
    console.log('✅ [API] Initiative updated:', row.id);
    res.json({
      id: row.id, name: row.name, product: row.product,
      currentGateId: row.current_gate_id, type: row.type,
      startDate: row.start_date, endDate: row.end_date,
      quarter: row.quarter, status: row.status,
      intakeRequestId: row.intake_request_id,
      pipelineActivated: row.pipeline_activated,
      artifacts: row.artifacts || []
    });
  } catch (error) {
    console.error('❌ [API] Error updating initiative:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/db/initiatives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM initiative WHERE id = $1', [id]);
    console.log('✅ [API] Initiative deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [API] Error deleting initiative:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- INTAKE REQUESTS ---

app.get('/api/db/intakes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM intake_request ORDER BY created_at DESC');
    const intakes = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      requester: row.requester,
      area: row.area,
      type: row.type,
      product: row.product,
      domain: row.domain,
      region: row.region,
      impactType: row.impact_type,
      severity: row.severity,
      urgency: row.urgency,
      problem: row.problem,
      outcome: row.outcome,
      scope: row.scope || [],
      constraints: row.constraints,
      alternatives: row.alternatives,
      kpi: row.kpi,
      status: row.status,
      ariaAnalysis: row.aria_analysis,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
    }));
    console.log(`✅ [API] Fetched ${intakes.length} intake requests`);
    res.json(intakes);
  } catch (error) {
    console.error('❌ [API] Error fetching intakes:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/db/intakes', async (req, res) => {
  try {
    const intake = req.body;
    const result = await query(
      `INSERT INTO intake_request (id, title, requester, area, type, product, domain, region, impact_type, severity, urgency, problem, outcome, scope, constraints, alternatives, kpi, status, aria_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [intake.id, intake.title, intake.requester, intake.area, intake.type,
       intake.product, intake.domain, intake.region, intake.impactType,
       intake.severity, intake.urgency, intake.problem, intake.outcome,
       JSON.stringify(intake.scope || []), intake.constraints, intake.alternatives,
       intake.kpi, intake.status || 'G0_Intake', intake.ariaAnalysis]
    );
    const row = result.rows[0];
    console.log('✅ [API] Intake created:', row.id);
    res.json({
      id: row.id, title: row.title, requester: row.requester,
      area: row.area, type: row.type, product: row.product,
      domain: row.domain, region: row.region, impactType: row.impact_type,
      severity: row.severity, urgency: row.urgency, problem: row.problem,
      outcome: row.outcome, scope: row.scope || [], constraints: row.constraints,
      alternatives: row.alternatives, kpi: row.kpi, status: row.status,
      ariaAnalysis: row.aria_analysis,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
    });
  } catch (error) {
    console.error('❌ [API] Error creating intake:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/db/intakes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIdx = 1;
    
    const fieldMap = {
      title: 'title', requester: 'requester', area: 'area', type: 'type',
      product: 'product', domain: 'domain', region: 'region',
      impactType: 'impact_type', severity: 'severity', urgency: 'urgency',
      problem: 'problem', outcome: 'outcome', constraints: 'constraints',
      alternatives: 'alternatives', kpi: 'kpi', status: 'status',
      ariaAnalysis: 'aria_analysis'
    };
    
    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updates[jsKey] !== undefined) {
        setClauses.push(`${dbKey} = $${paramIdx}`);
        values.push(updates[jsKey]);
        paramIdx++;
      }
    }
    
    if (updates.scope !== undefined) {
      setClauses.push(`scope = $${paramIdx}`);
      values.push(JSON.stringify(updates.scope));
      paramIdx++;
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const result = await query(
      `UPDATE intake_request SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intake not found' });
    }
    
    const row = result.rows[0];
    console.log('✅ [API] Intake updated:', row.id);
    res.json({
      id: row.id, title: row.title, requester: row.requester,
      area: row.area, type: row.type, product: row.product,
      domain: row.domain, region: row.region, impactType: row.impact_type,
      severity: row.severity, urgency: row.urgency, problem: row.problem,
      outcome: row.outcome, scope: row.scope || [], constraints: row.constraints,
      alternatives: row.alternatives, kpi: row.kpi, status: row.status,
      ariaAnalysis: row.aria_analysis,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
    });
  } catch (error) {
    console.error('❌ [API] Error updating intake:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- ARTIFACT DEFINITIONS ---

app.get('/api/db/artifact-definitions', async (req, res) => {
  try {
    const result = await query('SELECT * FROM artifact_definition ORDER BY gate, name');
    const definitions = result.rows.map(row => ({
      id: row.id,
      gate: row.gate,
      name: row.name,
      initiativeType: row.initiative_type,
      predecessorIds: row.predecessor_ids || [],
      description: row.description,
      mandatory: row.mandatory,
      area: row.area || 'Producto',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
    }));
    console.log(`✅ [API] Fetched ${definitions.length} artifact definitions`);
    res.json(definitions);
  } catch (error) {
    console.error('❌ [API] Error fetching artifact definitions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/db/artifact-definitions', async (req, res) => {
  try {
    const def = req.body;
    const result = await query(
      `INSERT INTO artifact_definition (id, gate, name, initiative_type, predecessor_ids, description, mandatory, area)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [def.id, def.gate, def.name, def.initiativeType || 'Both',
       JSON.stringify(def.predecessorIds || []), def.description, def.mandatory || false, def.area || 'Producto']
    );
    const row = result.rows[0];
    console.log('✅ [API] Artifact definition created:', row.id);
    res.json({
      id: row.id, gate: row.gate, name: row.name,
      initiativeType: row.initiative_type,
      predecessorIds: row.predecessor_ids || [],
      description: row.description, mandatory: row.mandatory,
      area: row.area || 'Producto',
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    });
  } catch (error) {
    console.error('❌ [API] Error creating artifact definition:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/db/artifact-definitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIdx = 1;
    
    const fieldMap = {
      gate: 'gate', name: 'name', initiativeType: 'initiative_type',
      description: 'description', mandatory: 'mandatory', area: 'area'
    };
    
    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updates[jsKey] !== undefined) {
        setClauses.push(`${dbKey} = $${paramIdx}`);
        values.push(updates[jsKey]);
        paramIdx++;
      }
    }
    
    if (updates.predecessorIds !== undefined) {
      setClauses.push(`predecessor_ids = $${paramIdx}`);
      values.push(JSON.stringify(updates.predecessorIds));
      paramIdx++;
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const result = await query(
      `UPDATE artifact_definition SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artifact definition not found' });
    }
    
    const row = result.rows[0];
    console.log('✅ [API] Artifact definition updated:', row.id);
    res.json({
      id: row.id, gate: row.gate, name: row.name,
      initiativeType: row.initiative_type,
      predecessorIds: row.predecessor_ids || [],
      description: row.description, mandatory: row.mandatory,
      area: row.area || 'Producto',
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    });
  } catch (error) {
    console.error('❌ [API] Error updating artifact definition:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/db/artifact-definitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM artifact_definition WHERE id = $1', [id]);
    console.log('✅ [API] Artifact definition deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [API] Error deleting artifact definition:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

// Serve static React app
app.use(express.static(path.join(__dirname, 'dist')));

// All other routes serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(port, async () => {
  console.log(`🚀 ARIA Server running on port ${port}`);
  if (process.env.DATABASE_URL) {
    const dbStatus = await testConnection();
    console.log('🔌 Database:', dbStatus.success ? 'Connected' : 'Not connected - ' + dbStatus.error);
  } else {
    console.log('⚠️ DATABASE_URL not set — database features disabled, using localStorage fallback');
  }
});

