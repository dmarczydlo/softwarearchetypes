import { CalculatorRange } from "./CalculatorRange.js";
import { Parameters } from "./Parameters.js";

export class Ranges {
    readonly rangeSelector: string;
    private readonly _ranges: CalculatorRange[];

    constructor(rangeSelector: string, ranges: CalculatorRange[]) {
        if (!rangeSelector || rangeSelector.trim().length === 0) {
            throw new Error("Range selector cannot be null or blank");
        }
        this.rangeSelector = rangeSelector;
        this._ranges = [...ranges];
        this.validate(this._ranges);
    }

    static of(rangeSelector: string, ...ranges: CalculatorRange[]): Ranges {
        return new Ranges(rangeSelector, ranges);
    }

    private validate(ranges: CalculatorRange[]): void {
        if (ranges.length === 0) {
            throw new Error("Ranges cannot be empty");
        }
        this.validateCompatibility(ranges);
        this.validateNoOverlaps(ranges);
    }

    private validateCompatibility(ranges: CalculatorRange[]): void {
        if (ranges.length < 2) return;
        const first = ranges[0];
        for (let i = 1; i < ranges.length; i++) {
            if (!first.isCompatibleWith(ranges[i])) {
                throw new Error(
                    `All ranges must be of the same type. Found incompatible types: ${first.constructor.name} and ${ranges[i].constructor.name}`
                );
            }
        }
    }

    private validateNoOverlaps(ranges: CalculatorRange[]): void {
        for (let i = 0; i < ranges.length; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
                if (ranges[i].overlaps(ranges[j])) {
                    throw new Error(`Ranges cannot overlap: ${ranges[i]} overlaps with ${ranges[j]}`);
                }
            }
        }
    }

    findMatching(parameters: Parameters): CalculatorRange | null {
        const value = parameters.get(this.rangeSelector);
        if (value === undefined || value === null) {
            throw new Error(`Parameter '${this.rangeSelector}' is required but not found in parameters`);
        }
        return this._ranges.find(range => range.contains(value)) ?? null;
    }

    size(): number {
        return this._ranges.length;
    }

    toList(): CalculatorRange[] {
        return [...this._ranges];
    }

    toString(): string {
        return `Ranges[selector='${this.rangeSelector}', ranges=${this._ranges.map(r => r.toString()).join(", ")}]`;
    }
}
