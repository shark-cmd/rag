/**
 * Groups cues into semantically meaningful chunks based on sentence boundaries.
 * @param {Array<{start_sec:number,end_sec:number,text:string}>} cues
 * @param {string} videoId
 * @param {number} [maxChars=1000]
 * @returns {Array<{content:string,start_sec:number,end_sec:number,video_id:string}>}
 */
export function createSemanticChunks(cues, videoId, maxChars = 1000) {
  const chunks = [];
  let currentChunkText = '';
  let chunkStartTime = 0;

  cues.forEach((cue, index) => {
    if (!currentChunkText) {
      chunkStartTime = cue.start_sec;
    }

    const textToAdd = currentChunkText ? ` ${cue.text}` : cue.text;

    const isSentenceEnd = /[.?!]$/.test(cue.text.trim());
    const isMaxLength = currentChunkText.length + textToAdd.length > maxChars;
    const isLastCue = index === cues.length - 1;

    if ((isSentenceEnd && currentChunkText) || isMaxLength || isLastCue) {
      if (isLastCue && !isSentenceEnd && !isMaxLength) {
        currentChunkText += textToAdd;
      }

      chunks.push({
        content: currentChunkText.trim(),
        start_sec: chunkStartTime,
        end_sec: cue.end_sec,
        video_id: videoId,
      });
      currentChunkText = '';
    } else {
      currentChunkText += textToAdd;
    }
  });

  return chunks.filter((c) => c.content.length > 0);
}

