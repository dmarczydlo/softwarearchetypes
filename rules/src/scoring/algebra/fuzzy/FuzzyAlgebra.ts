import { Algebra } from "../Algebra";
import { CmpOp, cmpOpCompare } from "../../ast/CmpOp";
import { Metric } from "../../ast/Metric";
import { WindowContext } from "../../context/WindowContext";
import { FuzzyValue } from "./FuzzyValue";

export class FuzzyAlgebra implements Algebra<FuzzyValue> {
    private readonly margins: Map<Metric, number>;

    constructor(margins: Map<Metric, number>) {
        this.margins = margins;
    }

    and(a: FuzzyValue, b: FuzzyValue): FuzzyValue {
        return new FuzzyValue(Math.min(a.degree, b.degree));
    }

    or(a: FuzzyValue, b: FuzzyValue): FuzzyValue {
        return new FuzzyValue(Math.max(a.degree, b.degree));
    }

    not(a: FuzzyValue): FuzzyValue {
        return new FuzzyValue(1.0 - a.degree);
    }

    metricCmp(ctx: WindowContext, metric: Metric, op: CmpOp, value: number): FuzzyValue {
        const v = ctx.getMetric(metric);
        const margin = this.margins.get(metric) ?? 0.0;

        if (margin <= 0.0) {
            const crisp = cmpOpCompare(op, v, value);
            return new FuzzyValue(crisp ? 1.0 : 0.0);
        }

        switch (op) {
            case CmpOp.GT:
                return this.fuzzyGreater(v, value, margin);
            case CmpOp.GTE:
                return this.fuzzyGreater(v, value - 0.1 * margin, margin);
            case CmpOp.LT:
                return this.fuzzyLess(v, value, margin);
            case CmpOp.LTE:
                return this.fuzzyLess(v, value + 0.1 * margin, margin);
            case CmpOp.EQ:
                return this.fuzzyEqual(v, value, margin);
        }
    }

    private fuzzyGreater(v: number, threshold: number, margin: number): FuzzyValue {
        if (v <= threshold) return new FuzzyValue(0.0);
        if (v >= threshold + margin) return new FuzzyValue(1.0);
        return new FuzzyValue((v - threshold) / margin);
    }

    private fuzzyLess(v: number, threshold: number, margin: number): FuzzyValue {
        if (v >= threshold) return new FuzzyValue(0.0);
        if (v <= threshold - margin) return new FuzzyValue(1.0);
        return new FuzzyValue((threshold - v) / margin);
    }

    private fuzzyEqual(v: number, target: number, margin: number): FuzzyValue {
        const diff = Math.abs(v - target);
        if (diff >= margin) return new FuzzyValue(0.0);
        return new FuzzyValue(1.0 - (diff / margin));
    }

    constScore(value: number): FuzzyValue {
        return new FuzzyValue(value === 0 ? 0.0 : 1.0);
    }

    sum(children: FuzzyValue[]): FuzzyValue {
        let total = 0.0;
        for (const fv of children) total += fv.degree;
        if (total > 1.0) total = 1.0;
        return new FuzzyValue(total);
    }

    ifThenElse(cond: FuzzyValue, thenV: FuzzyValue, elseV: FuzzyValue): FuzzyValue {
        const c = cond.degree;
        const res = c * thenV.degree + (1.0 - c) * elseV.degree;
        return new FuzzyValue(res);
    }
}
