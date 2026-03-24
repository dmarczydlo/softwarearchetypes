/**
 * Defines the safe set of data types that can be used for product feature values.
 * Each type knows how to convert between its runtime representation and String (for persistence).
 */
export enum FeatureValueType {
    TEXT = "TEXT",
    INTEGER = "INTEGER",
    DECIMAL = "DECIMAL",
    DATE = "DATE",
    BOOLEAN = "BOOLEAN",
}

export abstract class FeatureValueTypeOps {

    static castFrom(type: FeatureValueType, value: string): unknown {
        switch (type) {
            case FeatureValueType.TEXT:
                return value;
            case FeatureValueType.INTEGER: {
                const parsed = parseInt(value, 10);
                if (isNaN(parsed)) throw new Error(`Cannot parse integer: ${value}`);
                return parsed;
            }
            case FeatureValueType.DECIMAL: {
                const parsed = parseFloat(value);
                if (isNaN(parsed)) throw new Error(`Cannot parse decimal: ${value}`);
                return parsed;
            }
            case FeatureValueType.DATE:
                return value; // ISO date string e.g. "2024-06-15"
            case FeatureValueType.BOOLEAN:
                return value === "true";
        }
    }

    static castTo(type: FeatureValueType, value: unknown): string {
        return String(value);
    }

    static isInstance(type: FeatureValueType, value: unknown): boolean {
        if (value === null || value === undefined) return false;
        switch (type) {
            case FeatureValueType.TEXT:
                return typeof value === "string";
            case FeatureValueType.INTEGER:
                return typeof value === "number" && Number.isInteger(value);
            case FeatureValueType.DECIMAL:
                return typeof value === "number";
            case FeatureValueType.DATE:
                return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
            case FeatureValueType.BOOLEAN:
                return typeof value === "boolean";
        }
    }

    static typeName(type: FeatureValueType): string {
        switch (type) {
            case FeatureValueType.TEXT: return "String";
            case FeatureValueType.INTEGER: return "Integer";
            case FeatureValueType.DECIMAL: return "Number";
            case FeatureValueType.DATE: return "String";
            case FeatureValueType.BOOLEAN: return "Boolean";
        }
    }
}
