import { Score } from "../Score";
import { CmpOp, cmpOpCompare } from "../../../ast/CmpOp";
import { Metric } from "../../../ast/Metric";
import { WindowContext } from "../../../context/WindowContext";
import { ScoringAlgebra } from "./ScoringAlgebra";

export class SimpleScoringAlgebra implements ScoringAlgebra {
    and(a: Score, b: Score): Score {
        return new Score(Math.min(a.value, b.value));
    }

    or(a: Score, b: Score): Score {
        return new Score(Math.max(a.value, b.value));
    }

    not(a: Score): Score {
        const v = a.value;
        return v <= 0 ? new Score(1) : new Score(0);
    }

    metricCmp(ctx: WindowContext, metric: Metric, op: CmpOp, value: number): Score {
        const metricValue = ctx.getMetric(metric);
        const result = cmpOpCompare(op, metricValue, value);
        return new Score(result ? 1 : 0);
    }

    constScore(value: number): Score {
        return new Score(value);
    }

    sum(children: Score[]): Score {
        let total = 0;
        for (const s of children) {
            total += s.value;
        }
        return new Score(total);
    }

    ifThenElse(cond: Score, thenScore: Score, elseScore: Score): Score {
        return cond.value > 0 ? thenScore : elseScore;
    }
}
