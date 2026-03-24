import { Contribution } from "./Contribution";

export class ExplainedScore {
    readonly total: number;
    readonly contributions: readonly Contribution[];

    constructor(total: number, contributions: Contribution[]) {
        this.total = total;
        this.contributions = Object.freeze([...contributions]);
    }

    plus(other: ExplainedScore): ExplainedScore {
        const newTotal = this.total + other.total;
        const merged = [...this.contributions, ...other.contributions];
        return new ExplainedScore(newTotal, merged);
    }
}
