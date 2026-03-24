import { Money } from "@softwarearchetypes/quantity";

export class Parameters {
    private readonly values: Map<string, unknown>;

    constructor(values?: Map<string, unknown> | Record<string, unknown>) {
        if (!values) {
            this.values = new Map();
        } else if (values instanceof Map) {
            this.values = new Map(values);
        } else {
            this.values = new Map(Object.entries(values));
        }
    }

    static empty(): Parameters {
        return new Parameters();
    }

    static of(key: string, value: unknown): Parameters;
    static of(k1: string, v1: unknown, k2: string, v2: unknown): Parameters;
    static of(k1: string, v1: unknown, k2: string, v2: unknown, k3: string, v3: unknown): Parameters;
    static of(k1: string, v1: unknown, k2: string, v2: unknown, k3: string, v3: unknown, k4: string, v4: unknown): Parameters;
    static of(k1: string, v1: unknown, k2: string, v2: unknown, k3: string, v3: unknown, k4: string, v4: unknown, k5: string, v5: unknown): Parameters;
    static of(...args: unknown[]): Parameters {
        const map = new Map<string, unknown>();
        for (let i = 0; i < args.length; i += 2) {
            map.set(args[i] as string, args[i + 1]);
        }
        return new Parameters(map);
    }

    getNumber(key: string): number {
        const value = this.values.get(key);
        if (typeof value === "number") {
            return value;
        }
        if (typeof value === "string") {
            const num = Number(value);
            if (!isNaN(num)) return num;
        }
        throw new Error(`Cannot convert ${value} to number`);
    }

    getMoney(key: string): Money {
        const value = this.values.get(key);
        if (value instanceof Money) {
            return value;
        }
        if (typeof value === "string") {
            const parts = value.trim().split(/\s+/);
            if (parts.length !== 2) {
                throw new Error(`Invalid Money format: ${value}. Expected format: 'PLN 1999.00'`);
            }
            const currency = parts[0].toUpperCase();
            const amount = Number(parts[1]);
            return Money.of(amount, currency);
        }
        throw new Error(`Cannot convert ${value} to Money`);
    }

    getDate(key: string): Date {
        const value = this.values.get(key);
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === "string") {
            return new Date(value);
        }
        throw new Error(`Cannot convert ${value} to Date`);
    }

    getTime(key: string): Date {
        return this.getDate(key);
    }

    timestamp(): Date | null {
        if (this.contains("timestamp")) {
            return this.getDate("timestamp");
        }
        return null;
    }

    requireTimestamp(): Date {
        const ts = this.timestamp();
        if (ts === null) {
            throw new Error("Parameters must contain 'timestamp' for versioned calculations");
        }
        return ts;
    }

    contains(key: string): boolean {
        return this.values.has(key);
    }

    containsAll(keys: Set<string>): boolean {
        for (const key of keys) {
            if (!this.values.has(key)) return false;
        }
        return true;
    }

    get(key: string): unknown {
        return this.values.get(key);
    }

    keys(): Set<string> {
        return new Set(this.values.keys());
    }

    with(key: string, value: unknown): Parameters {
        const newMap = new Map(this.values);
        newMap.set(key, value);
        return new Parameters(newMap);
    }

    toString(): string {
        const entries: string[] = [];
        this.values.forEach((v, k) => entries.push(`${k}=${v}`));
        return `Parameters{${entries.join(", ")}}`;
    }

    equals(other: Parameters): boolean {
        if (this.values.size !== other.values.size) return false;
        for (const [key, value] of this.values) {
            const otherValue = other.values.get(key);
            if (value instanceof Date && otherValue instanceof Date) {
                if (value.getTime() !== otherValue.getTime()) return false;
            } else if (value instanceof Money && otherValue instanceof Money) {
                if (!value.equals(otherValue)) return false;
            } else if (value !== otherValue) {
                return false;
            }
        }
        return true;
    }

    hashCode(): number {
        let hash = 0;
        for (const [key, value] of this.values) {
            hash = ((hash << 5) - hash + key.length) | 0;
        }
        return hash;
    }
}
