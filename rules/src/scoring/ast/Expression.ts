import { CmpOp } from "./CmpOp";
import { Metric } from "./Metric";

export interface ExpressionVisitor<R> {
    visitAnd(expr: AndExpression): R;
    visitOr(expr: OrExpression): R;
    visitNot(expr: NotExpression): R;
    visitMetricCmp(expr: MetricCmpExpression): R;
    visitConstScore(expr: ConstScoreExpression): R;
    visitSum(expr: SumExpression): R;
    visitIfThenElse(expr: IfThenElseExpression): R;
    visitLabeled(expr: LabeledExpression): R;
}

export interface Expression {
    accept<R>(visitor: ExpressionVisitor<R>): R;
}

export class AndExpression implements Expression {
    constructor(
        readonly left: Expression,
        readonly right: Expression
    ) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitAnd(this);
    }
}

export class OrExpression implements Expression {
    constructor(
        readonly left: Expression,
        readonly right: Expression
    ) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitOr(this);
    }
}

export class NotExpression implements Expression {
    constructor(readonly inner: Expression) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitNot(this);
    }
}

export class MetricCmpExpression implements Expression {
    constructor(
        readonly metric: Metric,
        readonly op: CmpOp,
        readonly value: number
    ) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitMetricCmp(this);
    }
}

export class ConstScoreExpression implements Expression {
    constructor(readonly value: number) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitConstScore(this);
    }
}

export class SumExpression implements Expression {
    constructor(readonly children: Expression[]) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitSum(this);
    }
}

export class IfThenElseExpression implements Expression {
    constructor(
        readonly cond: Expression,
        readonly thenBranch: Expression,
        readonly elseBranch: Expression
    ) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitIfThenElse(this);
    }
}

export class LabeledExpression implements Expression {
    constructor(
        readonly label: string,
        readonly inner: Expression
    ) {}

    accept<R>(visitor: ExpressionVisitor<R>): R {
        return visitor.visitLabeled(this);
    }
}
