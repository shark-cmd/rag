import { parse } from 'node-webvtt';

/**
 * Parses VTT file content into a standardized list of cue objects.
 * @param {string} vttContent - The raw string content of the .vtt file.
 * @returns {Array<{start_sec:number,end_sec:number,text:string}>}
 */
export function parseVtt(vttContent) {
  const parsedVtt = parse(vttContent, { meta: true });
  if (!parsedVtt || !parsedVtt.valid || !parsedVtt.cues) {
    throw new Error('Invalid VTT content provided.');
  }

  return parsedVtt.cues.map((cue) => ({
    start_sec: cue.start,
    end_sec: cue.end,
    text: String(cue.text || '').replace(/\n/g, ' ').trim(),
  }));
}

