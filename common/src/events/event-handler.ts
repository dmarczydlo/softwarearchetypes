import { PublishedEvent } from './published-event.js';

export interface EventHandler {

    supports(event: PublishedEvent): boolean;

    handle(event: PublishedEvent): void;
}
