export enum ProductTrackingStrategy {
    UNIQUE = "UNIQUE",
    INDIVIDUALLY_TRACKED = "INDIVIDUALLY_TRACKED",
    BATCH_TRACKED = "BATCH_TRACKED",
    INDIVIDUALLY_AND_BATCH_TRACKED = "INDIVIDUALLY_AND_BATCH_TRACKED",
    IDENTICAL = "IDENTICAL",
}

export abstract class ProductTrackingStrategyOps {

    static isTrackedIndividually(strategy: ProductTrackingStrategy): boolean {
        return strategy === ProductTrackingStrategy.UNIQUE
            || strategy === ProductTrackingStrategy.INDIVIDUALLY_TRACKED
            || strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
    }

    static isTrackedByBatch(strategy: ProductTrackingStrategy): boolean {
        return strategy === ProductTrackingStrategy.BATCH_TRACKED
            || strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
    }

    static requiresBothTrackingMethods(strategy: ProductTrackingStrategy): boolean {
        return strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
    }

    static isInterchangeable(strategy: ProductTrackingStrategy): boolean {
        return strategy === ProductTrackingStrategy.IDENTICAL;
    }
}
