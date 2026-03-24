import { RichLogicalPredicate } from "../../../predicates/RichLogicalPredicate";
import { ClientContext } from "../ClientContext";

export enum ChronoUnit {
    DAYS = "DAYS",
    WEEKS = "WEEKS",
    MONTHS = "MONTHS",
    YEARS = "YEARS",
}

export class TimeBeingCustomer extends RichLogicalPredicate<ClientContext> {
    private readonly _threshold: number;
    private readonly _unit: ChronoUnit;

    constructor(threshold: number, unit: ChronoUnit) {
        super();
        this._threshold = threshold;
        this._unit = unit;
    }

    static ofDays(threshold: number): TimeBeingCustomer {
        return new TimeBeingCustomer(threshold, ChronoUnit.DAYS);
    }

    static ofWeeks(threshold: number): TimeBeingCustomer {
        return new TimeBeingCustomer(threshold, ChronoUnit.WEEKS);
    }

    static ofMonths(threshold: number): TimeBeingCustomer {
        return new TimeBeingCustomer(threshold, ChronoUnit.MONTHS);
    }

    static ofYears(threshold: number): TimeBeingCustomer {
        return new TimeBeingCustomer(threshold, ChronoUnit.YEARS);
    }

    test(clientContext: ClientContext): boolean {
        const now = new Date();
        const firstOrder = clientContext.firstOrder;

        switch (this._unit) {
            case ChronoUnit.DAYS: {
                const diffMs = now.getTime() - firstOrder.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                return diffDays >= this._threshold;
            }
            case ChronoUnit.WEEKS: {
                const diffMs = now.getTime() - firstOrder.getTime();
                const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
                return diffWeeks >= this._threshold;
            }
            case ChronoUnit.MONTHS: {
                const months = (now.getFullYear() - firstOrder.getFullYear()) * 12
                    + (now.getMonth() - firstOrder.getMonth());
                return months >= this._threshold;
            }
            case ChronoUnit.YEARS: {
                const years = now.getFullYear() - firstOrder.getFullYear();
                return years >= this._threshold;
            }
            default:
                return false;
        }
    }

    getThreshold(): number {
        return this._threshold;
    }

    getUnit(): ChronoUnit {
        return this._unit;
    }
}
