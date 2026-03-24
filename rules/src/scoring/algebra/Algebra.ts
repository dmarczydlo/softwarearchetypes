import { CmpOp } from "../ast/CmpOp";
import { Metric } from "../ast/Metric";
import { WindowContext } from "../context/WindowContext";

export interface Algebra<R> {
    or(left: R, right: R): R;
    and(left: R, right: R): R;
    not(inner: R): R;
    metricCmp(ctx: WindowContext, metric: Metric, op: CmpOp, value: number): R;
    constScore(value: number): R;
    sum(list: R[]): R;
    ifThenElse(cond: R, thenV: R, elseV: R): R;
    label?(label: string, inner: R): R;
}
