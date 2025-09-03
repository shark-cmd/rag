import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseVtt } from '../src/parser/parser.js';
import { createSemanticChunks } from '../src/parser/chunker.js';
import { embedText, getEmbeddingModel } from '../src/embeddings/google.js';
import { ensureCollection, upsertChunks } from '../src/qdrant/client.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = value;
    }
  }
  return args;
}

async function limitConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function next() {
    const current = index++;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    return next();
  }
  const starters = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(starters);
  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  const file = args.file || args.f;
  const videoId = args.videoId || args.id || path.basename(String(file || ''), path.extname(String(file || '')));
  const videoUrl = args.url || '';
  const videoTitle = args.title || '';
  const maxChars = args.maxChars ? Number(args.maxChars) : 1000;
  const concurrency = args.concurrency ? Number(args.concurrency) : 8;

  if (!file) {
    console.error('Usage: npm run ingest -- --file /path/to/file.vtt --videoId my-video --url https://... --title "Title"');
    process.exit(1);
  }

  const vttContent = await fs.readFile(file, 'utf8');
  const cues = parseVtt(vttContent);
  const chunks = createSemanticChunks(cues, videoId, maxChars);

  console.log(`Embedding ${chunks.length} chunks using model ${getEmbeddingModel()} ...`);
  const embedded = await limitConcurrency(chunks, concurrency, async (chunk) => {
    const vector = await embedText(chunk.content);
    return { ...chunk, vector, video_url: videoUrl, video_title: videoTitle };
  });

  await ensureCollection();
  const { upserted } = await upsertChunks(embedded);
  console.log(`Upserted ${upserted} chunks for video_id=${videoId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

