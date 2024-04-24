export interface CreateContentData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

export interface VideoDAO {
  create(videoData: CreateContentData): Promise<void>;
}

export const VideoDAO = Symbol('VideoData');
