import { EventHandler } from './event-handler.js';
import { PublishedEvent } from './published-event.js';

export interface EventPublisher {

    publish(eventOrEvents: PublishedEvent | PublishedEvent[]): void;

    register(eventHandler: EventHandler): void;
}
