import { PublishedEvent } from './published-event.js';

export interface EventPublisher {
    publish(eventOrEvents: PublishedEvent | PublishedEvent[]): void;
}
