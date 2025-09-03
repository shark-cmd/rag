## Timestamp-Aware RAG for VTT (Node.js)

This project implements a Retrieval-Augmented Generation (RAG) system for WebVTT video transcripts. It answers questions about videos and returns clickable, timestamped citations that jump to the relevant moment in the video.

### Features

- Semantic retrieval over VTT transcripts
- Context-grounded answers with strict citations
- Clickable `[MM:SS]` links to the video moment
- Qdrant vector database + Google Gemini for embeddings and generation

### Tech Stack

- Node.js runtime
- node-webvtt for parsing VTT
- Google Embeddings: `text-embedding-004` (default)
- Vector DB: Qdrant Cloud
- LLM: Google Gemini (`gemini-1.5-flash` by default)
- Express API + minimal static frontend

### Quickstart

1) Install dependencies

```bash
npm install
```

2) Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required:

- `QDRANT_URL`, `QDRANT_API_KEY`
- `GEMINI_API_KEY`

Optional:

- `COLLECTION_NAME` (default: `video_transcripts`)
- `EMBEDDING_MODEL` (default: `text-embedding-004`)
- `GENERATION_MODEL` (default: `gemini-1.5-flash`)
- `PORT` (default: `3000`)

3) Ingest a VTT file

```bash
npm run ingest -- --file path/to/transcript.vtt --videoId my-video-123 \
  --url https://your-platform.com/videos/my-video-123 --title "Video Title"
```

This will parse and chunk the VTT, embed chunks with Google, and upsert into Qdrant.

4) Start API server

```bash
npm run dev
```

Endpoints:

- `POST /ask` body: `{ "query": "...", "videoId": "optional" }`

5) Open demo frontend

Visit `http://localhost:3000/` and ask a question. Citations in the answer are clickable.

### Project Structure

```text
src/
  embeddings/google.js
  parser/
    parser.js
    chunker.js
  qdrant/client.js
  retrieval/
    prompt.js
    service.js
  server/index.js
scripts/
  ingest.js
public/
  index.html
```

### Notes

- Embedding vector size is inferred from the model. `embedding-001` is 768-dim; `text-embedding-004` is 3072-dim.
- Set `QDRANT_RECREATE=true` to force-recreate the collection during ingestion.
