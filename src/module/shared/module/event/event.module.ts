import { Global, Module } from '@nestjs/common';
import { SimpleEventBus } from './service/simple-event-bus.service';
import { EVENT_BUS } from '../../core/event/event-bus.interface';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';

/**
 * Event Module
 *
 * Provides domain event infrastructure across the application.
 * Marked as @Global() so EVENT_BUS can be injected anywhere without importing this module.
 *
 * Current implementation uses SimpleEventBus (logs events).
 * Future: Replace with KafkaEventBus or RabbitMQEventBus.
 *
 * @example Usage in any service:
 * ```typescript
 * constructor(
 *   @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
 * ) {}
 * ```
 */
@Global()
@Module({
  providers: [
    AppLogger,
    {
      provide: EVENT_BUS,
      useClass: SimpleEventBus,
    },
  ],
  exports: [EVENT_BUS],
})
export class EventModule {}
