import { Score } from "../Score";
import { CmpOp } from "../../../ast/CmpOp";
import { Metric } from "../../../ast/Metric";
import { WindowContext } from "../../../context/WindowContext";

// Implementation alternative to Visitor - not important code, just sample
export interface ScoringAlgebra {
    and(a: Score, b: Score): Score;
    or(a: Score, b: Score): Score;
    not(a: Score): Score;
    metricCmp(ctx: WindowContext, metric: Metric, op: CmpOp, value: number): Score;
    constScore(value: number): Score;
    sum(children: Score[]): Score;
    ifThenElse(cond: Score, thenScore: Score, elseScore: Score): Score;
}
