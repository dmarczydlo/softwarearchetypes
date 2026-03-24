export class ProductMetadata {

    private readonly data: Map<string, string>;

    private constructor(data: Map<string, string>) {
        this.data = new Map(data);
    }

    static empty(): ProductMetadata {
        return new ProductMetadata(new Map());
    }

    static of(data: Map<string, string> | Record<string, string> | null): ProductMetadata {
        if (data == null) return new ProductMetadata(new Map());
        if (data instanceof Map) return new ProductMetadata(data);
        return new ProductMetadata(new Map(Object.entries(data)));
    }

    get(key: string): string | null {
        return this.data.get(key) ?? null;
    }

    getOrDefault(key: string, defaultValue: string): string {
        return this.data.get(key) ?? defaultValue;
    }

    has(key: string): boolean {
        return this.data.has(key);
    }

    asMap(): Map<string, string> {
        return new Map(this.data);
    }

    with(key: string, value: string): ProductMetadata {
        const newData = new Map(this.data);
        newData.set(key, value);
        return new ProductMetadata(newData);
    }

    toString(): string {
        const entries = Array.from(this.data.entries()).map(([k, v]) => `${k}=${v}`).join(", ");
        return `ProductMetadata{${entries}}`;
    }
}
