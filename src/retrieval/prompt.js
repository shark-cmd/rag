export function buildPrompt(userQuery, contexts) {
  const contextItems = contexts.map((c) => ({ content: c.content, start_sec: c.start_sec }));
  const contextJson = JSON.stringify(contextItems, null, 2);
  return [
    'You are an expert AI assistant that answers questions about video content.',
    'Your task is to answer the user\'s query based only on the provided video transcript context. Do not use any outside knowledge.',
    '',
    'Your answer must be concise and directly address the query.',
    'After each statement or claim in your answer, you must provide a citation in the format [timestamp].',
    'The timestamp should be the start_sec of the context passage that supports the statement. Format the timestamp as MM:SS.',
    '',
    `User Query:\n${userQuery}`,
    '',
    'Video Transcript Context:',
    '```json',
    contextJson,
    '```',
    '',
    'Answer:'
  ].join('\n');
}

