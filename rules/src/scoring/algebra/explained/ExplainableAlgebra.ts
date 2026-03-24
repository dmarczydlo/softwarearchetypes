import { Algebra } from "../Algebra";
import { CmpOp, cmpOpCompare } from "../../ast/CmpOp";
import { Metric } from "../../ast/Metric";
import { WindowContext } from "../../context/WindowContext";
import { Contribution } from "./Contribution";
import { ExplainedScore } from "./ExplainedScore";

export class ExplainableAlgebra implements Algebra<ExplainedScore> {
    and(a: ExplainedScore, b: ExplainedScore): ExplainedScore {
        const v = Math.min(a.total, b.total);
        return new ExplainedScore(v, this.merge(a, b));
    }

    or(a: ExplainedScore, b: ExplainedScore): ExplainedScore {
        const v = Math.max(a.total, b.total);
        return new ExplainedScore(v, this.merge(a, b));
    }

    not(a: ExplainedScore): ExplainedScore {
        const v = a.total > 0 ? 0 : 1;
        return new ExplainedScore(v, [...a.contributions]);
    }

    metricCmp(ctx: WindowContext, metric: Metric, op: CmpOp, value: number): ExplainedScore {
        const mv = ctx.getMetric(metric);
        const ok = cmpOpCompare(op, mv, value);
        return new ExplainedScore(ok ? 1 : 0, []);
    }

    constScore(value: number): ExplainedScore {
        return new ExplainedScore(value, []);
    }

    sum(children: ExplainedScore[]): ExplainedScore {
        let total = 0;
        const all: Contribution[] = [];
        for (const es of children) {
            total += es.total;
            all.push(...es.contributions);
        }
        return new ExplainedScore(total, all);
    }

    ifThenElse(cond: ExplainedScore, thenV: ExplainedScore, elseV: ExplainedScore): ExplainedScore {
        return cond.total > 0 ? thenV : elseV;
    }

    label(label: string, inner: ExplainedScore): ExplainedScore {
        const list = [...inner.contributions];
        if (inner.total !== 0) {
            list.push(new Contribution(label, inner.total));
        }
        return new ExplainedScore(inner.total, list);
    }

    private merge(a: ExplainedScore, b: ExplainedScore): Contribution[] {
        return [...a.contributions, ...b.contributions];
    }
}
