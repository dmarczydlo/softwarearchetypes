import { EventHandler } from './event-handler.js';
import { EventPublisher } from './event-publisher.js';
import { PublishedEvent } from './published-event.js';

export class InMemoryEventsPublisher implements EventPublisher {

    private readonly observers: Set<EventHandler> = new Set<EventHandler>();

    public publish(eventOrEvents: PublishedEvent | PublishedEvent[]): void {
        if (Array.isArray(eventOrEvents)) {
            eventOrEvents.forEach((event: PublishedEvent) => this.publish(event));
        } else {
            this.observers.forEach((handler: EventHandler) => {
                if (handler.supports(eventOrEvents)) {
                    handler.handle(eventOrEvents);
                }
            });
        }
    }

    public register(eventHandler: EventHandler): void {
        this.observers.add(eventHandler);
    }
}
