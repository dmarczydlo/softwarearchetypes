import { SelectionContext } from './selection-context';
import { WaitListEntry } from './wait-list-entry';
import { WaitListSelectionPolicy } from './wait-list-selection-policy';

export class QuotaSelectionPolicy<T> implements WaitListSelectionPolicy<T> {
    private readonly quotaConfig: Map<string, number>;
    private readonly allocated: Map<string, number>;
    private readonly segmentExtractor: (item: T) => string;

    constructor(quotaConfig: Map<string, number>, segmentExtractor: (item: T) => string) {
        this.quotaConfig = new Map(quotaConfig);
        this.allocated = new Map();
        this.segmentExtractor = segmentExtractor;
    }

    static of<T>(quotaConfig: Map<string, number>, segmentExtractor: (item: T) => string): QuotaSelectionPolicy<T> {
        return new QuotaSelectionPolicy(quotaConfig, segmentExtractor);
    }

    selectNext(queue: WaitListEntry<T>[], context: SelectionContext<T>): WaitListEntry<T> | null {
        for (let i = 0; i < queue.length; i++) {
            const entry = queue[i];
            const segment = this.segmentExtractor(entry.payload);
            const current = this.allocated.get(segment) ?? 0;
            const quota = this.quotaConfig.get(segment) ?? Number.MAX_SAFE_INTEGER;

            if (current < quota && context.canFulfill !== null && context.canFulfill(entry.payload)) {
                this.allocated.set(segment, current + 1);
                queue.splice(i, 1);
                return entry;
            }
        }

        return null;
    }

    resetQuotas(): void {
        this.allocated.clear();
    }

    resetQuota(segment: string): void {
        this.allocated.delete(segment);
    }

    getAllocated(segment: string): number {
        return this.allocated.get(segment) ?? 0;
    }

    getRemainingQuota(segment: string): number {
        const quota = this.quotaConfig.get(segment) ?? Number.MAX_SAFE_INTEGER;
        const current = this.allocated.get(segment) ?? 0;
        return Math.max(0, quota - current);
    }
}
