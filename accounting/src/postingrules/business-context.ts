export interface BusinessContext {
    data(): Map<string, unknown>;
    get<T>(key: string): T | null;
}

class EmptyBusinessContext implements BusinessContext {
    data(): Map<string, unknown> {
        return new Map();
    }
    get<T>(): T | null {
        return null;
    }
}

class MapBusinessContext implements BusinessContext {
    private readonly _data: Map<string, unknown>;

    constructor(data: Map<string, unknown>) {
        this._data = new Map(data);
    }

    data(): Map<string, unknown> {
        return this._data;
    }

    get<T>(key: string): T | null {
        const value = this._data.get(key);
        return value != null ? value as T : null;
    }
}

export const BusinessContextFactory = {
    empty(): BusinessContext {
        return new EmptyBusinessContext();
    },
    of(data: Map<string, unknown>): BusinessContext {
        return new MapBusinessContext(data);
    }
};
