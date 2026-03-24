export enum ProductTrackingStrategy {
    UNIQUE = 'UNIQUE',
    INDIVIDUALLY_TRACKED = 'INDIVIDUALLY_TRACKED',
    BATCH_TRACKED = 'BATCH_TRACKED',
    INDIVIDUALLY_AND_BATCH_TRACKED = 'INDIVIDUALLY_AND_BATCH_TRACKED',
    IDENTICAL = 'IDENTICAL',
}

export function isTrackedIndividually(strategy: ProductTrackingStrategy): boolean {
    return strategy === ProductTrackingStrategy.UNIQUE
        || strategy === ProductTrackingStrategy.INDIVIDUALLY_TRACKED
        || strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
}

export function isTrackedByBatch(strategy: ProductTrackingStrategy): boolean {
    return strategy === ProductTrackingStrategy.BATCH_TRACKED
        || strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
}

export function requiresBothTrackingMethods(strategy: ProductTrackingStrategy): boolean {
    return strategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
}

export function isInterchangeable(strategy: ProductTrackingStrategy): boolean {
    return strategy === ProductTrackingStrategy.IDENTICAL;
}
