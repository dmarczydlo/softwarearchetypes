import { EventHandler } from './event-handler.js';
import { EventPublisher } from './event-publisher.js';
import { PublishedEvent } from './published-event.js';

export class InMemoryEventsPublisher implements EventPublisher {

    private readonly observers: Set<EventHandler> = new Set<EventHandler>();

    public publish(event: PublishedEvent): void {
        this.observers.forEach((handler: EventHandler) => {
            if (handler.supports(event)) {
                handler.handle(event);
            }
        });
    }

    public publishAll(events: PublishedEvent[]): void {
        events.forEach((event: PublishedEvent) => this.publish(event));
    }

    public register(eventHandler: EventHandler): void {
        this.observers.add(eventHandler);
    }
}
