import { EventPublisher } from './event-publisher.js';
import { PublishedEvent } from './published-event.js';

export interface InMemoryEventObserver {
    handle(event: PublishedEvent): void;
}

export class InMemoryEventsPublisher implements EventPublisher {
    private readonly observers: Set<InMemoryEventObserver> = new Set();

    publish(event: PublishedEvent): void {
        this.observers.forEach(it => it.handle(event));
    }

    publishAll(events: PublishedEvent[]): void {
        events.forEach(e => this.publish(e));
    }

    register(observer: InMemoryEventObserver): void {
        this.observers.add(observer);
    }
}
