import {
    ExpressionVisitor,
    AndExpression,
    OrExpression,
    NotExpression,
    MetricCmpExpression,
    ConstScoreExpression,
    SumExpression,
    IfThenElseExpression,
    LabeledExpression,
} from "../ast/Expression";
import { WindowContext } from "../context/WindowContext";
import { Algebra } from "./Algebra";

export class AlgebraicVisitor<R> implements ExpressionVisitor<R> {
    private readonly ctx: WindowContext;
    private readonly algebra: Algebra<R>;

    constructor(ctx: WindowContext, algebra: Algebra<R>) {
        this.ctx = ctx;
        this.algebra = algebra;
    }

    visitAnd(expr: AndExpression): R {
        const left = expr.left.accept(this);
        const right = expr.right.accept(this);
        return this.algebra.and(left, right);
    }

    visitOr(expr: OrExpression): R {
        const left = expr.left.accept(this);
        const right = expr.right.accept(this);
        return this.algebra.or(left, right);
    }

    visitNot(expr: NotExpression): R {
        const inner = expr.inner.accept(this);
        return this.algebra.not(inner);
    }

    visitMetricCmp(expr: MetricCmpExpression): R {
        return this.algebra.metricCmp(this.ctx, expr.metric, expr.op, expr.value);
    }

    visitConstScore(expr: ConstScoreExpression): R {
        return this.algebra.constScore(expr.value);
    }

    visitSum(expr: SumExpression): R {
        const list: R[] = [];
        for (const child of expr.children) {
            list.push(child.accept(this));
        }
        return this.algebra.sum(list);
    }

    visitIfThenElse(expr: IfThenElseExpression): R {
        const cond = expr.cond.accept(this);
        const thenV = expr.thenBranch.accept(this);
        const elseV = expr.elseBranch.accept(this);
        return this.algebra.ifThenElse(cond, thenV, elseV);
    }

    visitLabeled(expr: LabeledExpression): R {
        const inner = expr.inner.accept(this);
        if (this.algebra.label) {
            return this.algebra.label(expr.label, inner);
        }
        return inner;
    }
}
