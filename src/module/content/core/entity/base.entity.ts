export interface BaseEntityProps {
  readonly id: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseEntity {
  protected readonly id: string;
  protected createdAt: Date;
  protected updatedAt: Date;

  constructor(props: BaseEntityProps) {
    Object.assign(this, props);
  }

  abstract serialize(): Record<string, unknown>;

  getId(): string {
    return this.id;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
