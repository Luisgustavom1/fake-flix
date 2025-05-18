export interface VideoSummaryGeneratorAdapter {
  generateSummary(videoUrl: string): Promise<string>;
}

export const VideoSummaryGeneratorAdapter = Symbol(
  'VideoSummaryGeneratorAdapter',
);
