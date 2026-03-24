import { PublishedEvent } from './published-event.js';

export interface EventPublisher {
    publish(event: PublishedEvent): void;
    publishAll(events: PublishedEvent[]): void;
}
