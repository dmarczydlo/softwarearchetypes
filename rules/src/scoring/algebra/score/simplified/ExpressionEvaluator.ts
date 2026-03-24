import { Score } from "../Score";
import {
    Expression,
    AndExpression,
    OrExpression,
    NotExpression,
    MetricCmpExpression,
    ConstScoreExpression,
    SumExpression,
    IfThenElseExpression,
} from "../../../ast/Expression";
import { WindowContext } from "../../../context/WindowContext";
import { ScoringAlgebra } from "./ScoringAlgebra";

export class ExpressionEvaluator {
    private constructor() {}

    static evaluate(expr: Expression, ctx: WindowContext, alg: ScoringAlgebra): Score {
        if (expr instanceof AndExpression) {
            const left = ExpressionEvaluator.evaluate(expr.left, ctx, alg);
            const right = ExpressionEvaluator.evaluate(expr.right, ctx, alg);
            return alg.and(left, right);
        } else if (expr instanceof OrExpression) {
            const left = ExpressionEvaluator.evaluate(expr.left, ctx, alg);
            const right = ExpressionEvaluator.evaluate(expr.right, ctx, alg);
            return alg.or(left, right);
        } else if (expr instanceof NotExpression) {
            const inner = ExpressionEvaluator.evaluate(expr.inner, ctx, alg);
            return alg.not(inner);
        } else if (expr instanceof MetricCmpExpression) {
            return alg.metricCmp(ctx, expr.metric, expr.op, expr.value);
        } else if (expr instanceof ConstScoreExpression) {
            return alg.constScore(expr.value);
        } else if (expr instanceof SumExpression) {
            const scores: Score[] = [];
            for (const child of expr.children) {
                scores.push(ExpressionEvaluator.evaluate(child, ctx, alg));
            }
            return alg.sum(scores);
        } else if (expr instanceof IfThenElseExpression) {
            const cond = ExpressionEvaluator.evaluate(expr.cond, ctx, alg);
            const thenScore = ExpressionEvaluator.evaluate(expr.thenBranch, ctx, alg);
            const elseScore = ExpressionEvaluator.evaluate(expr.elseBranch, ctx, alg);
            return alg.ifThenElse(cond, thenScore, elseScore);
        }

        throw new Error("Unknown expression type");
    }
}
