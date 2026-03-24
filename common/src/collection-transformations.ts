export abstract class CollectionTransformations {

    public static keyValueMapFrom(parameters: string[] | null): Map<string, string> {
        if (parameters == null) {
            return new Map<string, string>();
        }
        if (parameters.length % 2 !== 0) {
            throw new Error("The number of arguments must be even (key, productName, ...)");
        }
        const result: Map<string, string> = new Map<string, string>();
        for (let i: number = 0; i < parameters.length; i += 2) {
            const key: string = parameters[i];
            if (key == null || key.trim().length === 0) {
                throw new Error(`Key (idx=${i}) cannot be empty or null`);
            }
            result.set(key, parameters[i + 1]);
        }
        return result;
    }

    public static subtract<T>(minuend: Set<T>, subtrahend: Set<T>): Set<T> {
        const result: Set<T> = new Set<T>(minuend);
        for (const element of subtrahend) {
            result.delete(element);
        }
        return result;
    }
}
