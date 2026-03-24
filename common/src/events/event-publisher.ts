import { EventHandler } from './event-handler.js';
import { PublishedEvent } from './published-event.js';

export interface EventPublisher {

    publish(event: PublishedEvent): void;

    publishAll(events: PublishedEvent[]): void;

    register(eventHandler: EventHandler): void;
}
