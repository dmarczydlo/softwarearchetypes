import { Algebra } from "../Algebra";
import { CmpOp, cmpOpCompare } from "../../ast/CmpOp";
import { Metric } from "../../ast/Metric";
import { WindowContext } from "../../context/WindowContext";
import { Score } from "./Score";

export class ScoreAlgebra implements Algebra<Score> {
    and(a: Score, b: Score): Score {
        return new Score(Math.min(a.value, b.value)); // 0/1 AND
    }

    or(a: Score, b: Score): Score {
        return new Score(Math.max(a.value, b.value)); // 0/1 OR
    }

    not(a: Score): Score {
        return a.value > 0 ? new Score(0) : new Score(1);
    }

    metricCmp(ctx: WindowContext, metric: Metric, op: CmpOp, value: number): Score {
        const mv = ctx.getMetric(metric);
        const ok = cmpOpCompare(op, mv, value);
        return new Score(ok ? 1 : 0);
    }

    constScore(value: number): Score {
        return new Score(value);
    }

    sum(children: Score[]): Score {
        let total = 0;
        for (const s of children) total += s.value;
        return new Score(total);
    }

    ifThenElse(cond: Score, thenValue: Score, elseValue: Score): Score {
        return cond.value > 0 ? thenValue : elseValue;
    }
}
