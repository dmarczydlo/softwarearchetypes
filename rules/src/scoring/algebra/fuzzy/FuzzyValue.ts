/**
 * @param degree 0.0 .. 1.0
 */
export class FuzzyValue {
    readonly degree: number;

    constructor(degree: number) {
        if (degree < 0.0) degree = 0.0;
        if (degree > 1.0) degree = 1.0;
        this.degree = degree;
    }
}
