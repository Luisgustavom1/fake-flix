export interface VideoTranscriptGeneratorAdapter {
  generateTranscript(videoUrl: string): Promise<string>;
}

export const VideoTranscriptGeneratorAdapter = Symbol(
  'VideoTranscriptGeneratorAdapter',
);
