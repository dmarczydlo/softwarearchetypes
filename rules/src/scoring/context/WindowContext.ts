import { Metric } from "../ast/Metric";
import { CustomerEvent } from "../events/CustomerEvent";

export class WindowContext {
    private readonly _customerId: string | null;
    private readonly _from: Date | null;
    private readonly _to: Date | null;
    private readonly _events: CustomerEvent[] | null;
    private readonly _metrics: Map<Metric, number>;

    constructor(
        customerId: string | null,
        from: Date | null,
        to: Date | null,
        events: CustomerEvent[] | null,
        metrics: Map<Metric, number>
    ) {
        this._customerId = customerId;
        this._from = from;
        this._to = to;
        this._events = events;
        this._metrics = metrics;
    }

    getCustomerId(): string | null {
        return this._customerId;
    }

    getFrom(): Date | null {
        return this._from;
    }

    getTo(): Date | null {
        return this._to;
    }

    getEvents(): CustomerEvent[] | null {
        return this._events;
    }

    getMetrics(): Map<Metric, number> {
        return this._metrics;
    }

    getMetric(metric: Metric): number {
        return this._metrics.get(metric) ?? 0.0;
    }
}
