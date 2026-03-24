export class Score {
    static readonly ZERO = new Score(0);

    readonly value: number;

    constructor(value: number) {
        this.value = value;
    }

    plus(other: Score): Score {
        return new Score(this.value + other.value);
    }

    minus(other: Score): Score {
        return new Score(this.value - other.value);
    }

    equals(other: Score): boolean {
        return this.value === other.value;
    }
}
