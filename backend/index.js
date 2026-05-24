const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Runs, initDb } = require('./db');
const { runAnalysis } = require('./runner');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Serve screenshots
app.use('/screenshots', express.static(path.join(__dirname, '..', 'screenshots')));

// In-memory job queue
const jobQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || jobQueue.length === 0) return;
  isProcessing = true;
  const { id, url } = jobQueue.shift();
  try {
    console.log(`[PerfKit] Analyzing: ${url}`);
    const result = await runAnalysis(url);
    await Runs.updateResult(id, result);
    console.log(`[PerfKit] Done: ${url} (perf: ${result.score_performance})`);
  } catch (err) {
    console.error(`[PerfKit] Error analyzing ${url}:`, err.message);
    await Runs.updateError(id, err.message);
  }
  isProcessing = false;
  processQueue();
}

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string')
    return res.status(400).json({ error: 'url is required' });

  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
  try { new URL(normalized); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const id = uuidv4();
  await Runs.create(id, normalized);
  jobQueue.push({ id, url: normalized });
  processQueue();

  res.json({ id, status: 'pending', url: normalized });
});

// GET /api/runs/:id
app.get('/api/runs/:id', async (req, res) => {
  const run = await Runs.getById(req.params.id);
  if (!run) return res.status(404).json({ error: 'Not found' });
  res.json(run);
});

// GET /api/history
app.get('/api/history', async (req, res) => {
  const { url, limit } = req.query;
  res.json(await Runs.getHistory(parseInt(limit) || 50, url || null));
});

// GET /api/urls
app.get('/api/urls', async (req, res) => {
  res.json(await Runs.getUrls());
});

// GET /api/trend
app.get('/api/trend', async (req, res) => {
  const { url, limit } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  res.json(await Runs.getTrend(url, parseInt(limit) || 20));
});

// DELETE /api/runs/:id
app.delete('/api/runs/:id', async (req, res) => {
  await Runs.deleteRun(req.params.id);
  res.json({ ok: true });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, queue: jobQueue.length, processing: isProcessing });
});

// Boot
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 PerfKit backend running at http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
