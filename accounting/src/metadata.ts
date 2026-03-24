export class MetaData {
    readonly metadata: Map<string, string>;

    constructor(metadata: Map<string, string>) {
        this.metadata = metadata;
    }

    static readonly EMPTY = new MetaData(new Map<string, string>());

    static empty(): MetaData {
        return MetaData.EMPTY;
    }

    static of(metadata: Map<string, string> | null): MetaData {
        return metadata !== null ? new MetaData(metadata) : MetaData.EMPTY;
    }

    static ofKeyValues(...keyValues: string[]): MetaData {
        if (keyValues.length % 2 !== 0) {
            throw new Error("MetaData must have even number of elements (key-value pairs).");
        }
        const map = new Map<string, string>();
        for (let i = 0; i < keyValues.length; i += 2) {
            map.set(keyValues[i], keyValues[i + 1]);
        }
        return new MetaData(map);
    }

    equals(other: MetaData): boolean {
        if (this.metadata.size !== other.metadata.size) return false;
        for (const [key, value] of this.metadata) {
            if (other.metadata.get(key) !== value) return false;
        }
        return true;
    }
}
