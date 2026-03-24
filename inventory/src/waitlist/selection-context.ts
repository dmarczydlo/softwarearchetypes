export class SelectionContext<T> {
    readonly canFulfill: ((item: T) => boolean) | null;
    readonly metadata: Map<string, unknown>;
    readonly now: Date;

    constructor(
        canFulfill: ((item: T) => boolean) | null,
        metadata: Map<string, unknown>,
        now: Date,
    ) {
        this.canFulfill = canFulfill;
        this.metadata = metadata;
        this.now = now;
    }

    static empty<T>(): SelectionContext<T> {
        return new SelectionContext<T>((_x: T) => true, new Map(), new Date());
    }

    static withPredicate<T>(predicate: (item: T) => boolean): SelectionContext<T> {
        return new SelectionContext<T>(predicate, new Map(), new Date());
    }

    static withMetadata<T>(metadata: Map<string, unknown>): SelectionContext<T> {
        return new SelectionContext<T>((_x: T) => true, metadata, new Date());
    }

    static of<T>(
        predicate: (item: T) => boolean,
        metadata: Map<string, unknown>,
        now?: Date,
    ): SelectionContext<T> {
        return new SelectionContext<T>(predicate, metadata, now ?? new Date());
    }
}
