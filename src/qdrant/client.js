import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { getEmbeddingVectorSize, getEmbeddingModel } from '../embeddings/google.js';

const COLLECTION_NAME = process.env.COLLECTION_NAME || 'video_transcripts';

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Backward compat alias
export async function setupQdrantCollection() {
  return ensureCollection();
}

/**
 * Ensure collection exists with correct vector size and payload index.
 * Uses recreate when QDRANT_RECREATE=true otherwise create if missing.
 */
export async function ensureCollection() {
  const vectorSize = getEmbeddingVectorSize(getEmbeddingModel());
  const distance = 'Cosine';

  const recreate = String(process.env.QDRANT_RECREATE || '').toLowerCase() === 'true';

  if (recreate) {
    await qdrant.recreateCollection(COLLECTION_NAME, {
      vectors: { size: vectorSize, distance },
    });
  } else {
    // Try create; if exists, ignore
    try {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: { size: vectorSize, distance },
      });
    } catch (err) {
      // If already exists, continue
    }
  }

  try {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'video_id',
      field_schema: 'keyword',
      wait: true,
    });
  } catch (err) {
    // index might already exist
  }
}

/**
 * Upsert chunk points into Qdrant.
 * @param {Array<{id?:string, vector:number[], content:string, start_sec:number, end_sec:number, video_id:string, video_url?:string, video_title?:string}>} chunksWithVectors
 */
export async function upsertChunks(chunksWithVectors) {
  const points = chunksWithVectors.map((chunk, index) => ({
    id: chunk.id || `${chunk.video_id}-${chunk.start_sec}-${index}`,
    vector: chunk.vector,
    payload: {
      content: chunk.content,
      start_sec: chunk.start_sec,
      end_sec: chunk.end_sec,
      video_id: chunk.video_id,
      ...(chunk.video_url ? { video_url: chunk.video_url } : {}),
      ...(chunk.video_title ? { video_title: chunk.video_title } : {}),
    },
  }));

  await qdrant.upsert(COLLECTION_NAME, { points, wait: true });
  return { upserted: points.length };
}

/**
 * Search similar chunks by vector
 * @param {number[]} vector
 * @param {{topK?:number, videoId?:string}} options
 */
export async function searchSimilar(vector, options = {}) {
  const { topK = 6, videoId } = options;
  const filter = videoId
    ? { must: [{ key: 'video_id', match: { value: videoId } }] }
    : undefined;
  const res = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit: topK,
    filter,
    with_payload: true,
    with_vector: false,
  });
  return res?.result || [];
}

