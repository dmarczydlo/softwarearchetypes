import { Money } from "@softwarearchetypes/quantity";
import { Parameters } from "./Parameters.js";

export class PricingContext {
    private readonly attributes: Map<string, string>;
    private readonly _timestamp: Date;

    private constructor(attributes: Map<string, string>, timestamp: Date) {
        this.attributes = new Map(attributes);
        this._timestamp = timestamp;
    }

    static from(parameters: Parameters): PricingContext {
        const timestamp = parameters.timestamp() ?? new Date();

        const attributes = new Map<string, string>();
        for (const key of parameters.keys()) {
            const value = parameters.get(key);
            if (typeof value === "string") {
                attributes.set(key, value);
            } else if (typeof value === "number") {
                attributes.set(key, String(value));
            }
        }

        return new PricingContext(attributes, timestamp);
    }

    timestamp(): Date {
        return this._timestamp;
    }

    get(key: string): string | null {
        return this.attributes.get(key) ?? null;
    }

    getOrDefault(key: string, defaultValue: string): string {
        return this.attributes.get(key) ?? defaultValue;
    }

    has(key: string): boolean {
        return this.attributes.has(key);
    }

    toString(): string {
        const entries: string[] = [];
        this.attributes.forEach((v, k) => entries.push(`${k}=${v}`));
        return `PricingContext{timestamp=${this._timestamp.toISOString()}, attributes={${entries.join(", ")}}}`;
    }
}
