import { EventPublisher } from './event-publisher.js';
import { PublishedEvent } from './published-event.js';

export interface InMemoryEventObserver {
    handle(event: PublishedEvent): void;
}

export class InMemoryEventsPublisher implements EventPublisher {
    private readonly observers: Set<InMemoryEventObserver> = new Set();

    publish(eventOrEvents: PublishedEvent | PublishedEvent[]): void {
        if (Array.isArray(eventOrEvents)) {
            eventOrEvents.forEach(e => this.publish(e));
        } else {
            this.observers.forEach(it => it.handle(eventOrEvents));
        }
    }

    register(observer: InMemoryEventObserver): void {
        this.observers.add(observer);
    }
}
