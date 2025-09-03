import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { answerQuery } from '../retrieval/service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/ask', async (req, res) => {
  try {
    const { query, videoId, topK } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });
    const result = await answerQuery({ query, videoId, topK });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Serve static demo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', (req, res, next) => {
  if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
    res.sendFile(path.resolve(__dirname, '../../public/index.html'));
  } else next();
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

