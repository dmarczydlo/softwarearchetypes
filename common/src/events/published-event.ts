export interface PublishedEvent {

    id(): string;

    type(): string;

    occurredAt(): Date;
}
