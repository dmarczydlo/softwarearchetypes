export class OrderLineSpecification {
    private readonly _attributes: Map<string, string>;

    constructor(attributes: Map<string, string>) {
        this._attributes = new Map(attributes);
    }

    static empty(): OrderLineSpecification {
        return new OrderLineSpecification(new Map());
    }

    static of(key: string, value: string): OrderLineSpecification;
    static of(key1: string, value1: string, key2: string, value2: string): OrderLineSpecification;
    static of(attributes: Map<string, string>): OrderLineSpecification;
    static of(attributes: Record<string, string>): OrderLineSpecification;
    static of(...args: unknown[]): OrderLineSpecification {
        if (args.length === 1) {
            const arg = args[0];
            if (arg instanceof Map) {
                return new OrderLineSpecification(new Map(arg));
            }
            // Record<string, string>
            const record = arg as Record<string, string>;
            return new OrderLineSpecification(new Map(Object.entries(record)));
        }
        if (args.length === 2) {
            const map = new Map<string, string>();
            map.set(args[0] as string, args[1] as string);
            return new OrderLineSpecification(map);
        }
        if (args.length === 4) {
            const map = new Map<string, string>();
            map.set(args[0] as string, args[1] as string);
            map.set(args[2] as string, args[3] as string);
            return new OrderLineSpecification(map);
        }
        throw new Error("Invalid arguments for OrderLineSpecification.of");
    }

    with(key: string, value: string): OrderLineSpecification {
        const newAttributes = new Map(this._attributes);
        newAttributes.set(key, value);
        return new OrderLineSpecification(newAttributes);
    }

    get(key: string): string | null {
        return this._attributes.get(key) ?? null;
    }

    has(key: string): boolean {
        return this._attributes.has(key);
    }

    attributes(): Map<string, string> {
        return new Map(this._attributes);
    }

    features(): Map<string, string> {
        const result = new Map<string, string>();
        for (const [key, value] of this._attributes) {
            if (!key.startsWith("component.") && !key.startsWith("_") && !key.includes(".")) {
                result.set(key, value);
            }
        }
        return result;
    }

    components(): Map<string, string> {
        const result = new Map<string, string>();
        for (const [key, value] of this._attributes) {
            if (key.startsWith("component.")) {
                result.set(key.substring("component.".length), value);
            }
        }
        return result;
    }

    preferences(): Map<string, string> {
        const result = new Map<string, string>();
        for (const [key, value] of this._attributes) {
            if (key.startsWith("_")) {
                result.set(key.substring(1), value);
            }
        }
        return result;
    }

    toString(): string {
        const obj: Record<string, string> = {};
        for (const [k, v] of this._attributes) {
            obj[k] = v;
        }
        return "OrderLineSpecification" + JSON.stringify(obj);
    }
}
