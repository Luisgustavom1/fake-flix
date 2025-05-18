import { randomUUID } from 'crypto';
import { BaseEntity, BaseEntityProps } from './base.entity';

export type NewVideoEntity = Omit<
  VideoEntityProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface VideoEntityProps extends BaseEntityProps {
  url: string;
  sizeInKb: number;
}

export class VideoEntity extends BaseEntity {
  private url: VideoEntityProps['url'];
  private sizeInKb: VideoEntityProps['sizeInKb'];

  constructor({ id, createdAt, updatedAt, ...rest }: VideoEntityProps) {
    super({ id, createdAt, updatedAt });
    Object.assign(this, rest);
  }

  static createNew(data: NewVideoEntity, id = randomUUID()): VideoEntity {
    return new VideoEntity({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createFrom(data: VideoEntityProps): VideoEntity {
    return new VideoEntity(data);
  }

  static getMaxFileSize(): number {
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
    return MAX_FILE_SIZE;
  }

  static getMaxThumbnailSize(): number {
    const MAX_THUMBNAIL_SIZE = 1024 * 1024 * 10; // 10 MB
    return MAX_THUMBNAIL_SIZE;
  }

  serialize() {
    return {
      id: this.id,
      url: this.url,
      sizeInKb: this.sizeInKb,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getUrl() {
    return this.url;
  }

  getSizeInKb() {
    return this.sizeInKb;
  }
}
