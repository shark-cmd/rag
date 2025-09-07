import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-004';

/**
 * Returns embedding vector for a given text using Google Gemini Embeddings API.
 * @param {string} text
 * @param {string} [model]
 * @returns {Promise<number[]>}
 */
export async function embedText(text, model = DEFAULT_EMBEDDING_MODEL) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const embeddingModel = genAI.getGenerativeModel({ model });
  const result = await embeddingModel.embedContent(text);
  const vector = result?.embedding?.values;
  if (!Array.isArray(vector)) {
    throw new Error('Failed to generate embedding vector');
  }
  return vector;
}

/**
 * Determine embedding vector size based on model.
 * @param {string} [model]
 */
export function getEmbeddingVectorSize(model = DEFAULT_EMBEDDING_MODEL) {
  // Known sizes as of 2025-01
  // embedding-001 => 768, text-embedding-004 => 3072
  if (model === 'embedding-001') return 768;
  if (model === 'text-embedding-004') return 3072;
  // Fallback: default to 3072 for newer models
  return 3072;
}

export function getEmbeddingModel() {
  return DEFAULT_EMBEDDING_MODEL;
}

