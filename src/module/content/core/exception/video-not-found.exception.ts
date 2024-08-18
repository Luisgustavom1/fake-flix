import { DomainException } from './domain.exception';

export class VideoNotFoundException extends DomainException {
  constructor(videoId: string) {
    super(`Video with id ${videoId} not found`);
  }
}
