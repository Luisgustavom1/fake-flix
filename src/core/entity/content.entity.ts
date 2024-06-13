import { randomUUID } from 'crypto';
import { MovieEntity } from './movie.entity';
import { BaseEntity, BaseEntityProps } from '@src/core/entity/base.entity';
import { ContentType } from './content-type.enum';

export interface ContentEntityProps extends BaseEntityProps {
  media?: MovieEntity;
  type: ContentType;
  title: string;
  description: string;
}

export class ContentEntity extends BaseEntity {
  private media?: ContentEntityProps['media'];
  private type: ContentEntityProps['type'];
  private title: ContentEntityProps['title'];
  private description: ContentEntityProps['description'];

  private constructor({
    id,
    createdAt,
    updatedAt,
    ...rest
  }: ContentEntityProps) {
    super({ id, createdAt, updatedAt });
    Object.assign(this, rest);
  }

  static createNew(
    data: Omit<ContentEntityProps, 'id' | 'createdAt' | 'updatedAt'>,
    id = randomUUID(),
  ): ContentEntity {
    return new ContentEntity({
      id,
      media: data.media,
      type: data.type,
      title: data.title,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createFrom(data: ContentEntityProps): ContentEntity {
    return new ContentEntity({
      id: data.id,
      media: data.media,
      type: data.type,
      title: data.title,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  serialize() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      media: this.media?.serialize(),
      type: this.type,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  addMedia(media: MovieEntity): void {
    this.media = media;
  }

  getMedia(): MovieEntity | undefined {
    return this.media;
  }

  getType(): ContentType {
    return this.type;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }
}
