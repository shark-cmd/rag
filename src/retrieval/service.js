import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { embedText } from '../embeddings/google.js';
import { searchSimilar } from '../qdrant/client.js';
import { buildPrompt } from './prompt.js';

const GENERATION_MODEL = process.env.GENERATION_MODEL || 'gemini-1.5-flash';

function secondsToTimestampMMSS(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export async function answerQuery({ query, videoId, topK = 6 }) {
  const vector = await embedText(query);
  const hits = await searchSimilar(vector, { topK, videoId });

  const contexts = hits.map((h) => ({
    content: h.payload.content,
    start_sec: h.payload.start_sec,
  }));

  const prompt = buildPrompt(query, contexts);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GENERATION_MODEL });
  const res = await model.generateContent(prompt);
  const answer = res?.response?.text?.() || '';

  const sources = hits.map((h) => ({
    content: h.payload.content,
    start_sec: h.payload.start_sec,
    end_sec: h.payload.end_sec,
    video_id: h.payload.video_id,
    video_url: h.payload.video_url || '',
    start_mmss: secondsToTimestampMMSS(h.payload.start_sec),
  }));

  return { answer, sources };
}

