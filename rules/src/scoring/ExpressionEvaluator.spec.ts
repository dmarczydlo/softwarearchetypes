import { describe, it, expect } from "vitest";
import { AlgebraicVisitor } from "./algebra/AlgebraicVisitor";
import { Score } from "./algebra/score/Score";
import { ScoreAlgebra } from "./algebra/score/ScoreAlgebra";
import { SimpleScoringAlgebra } from "./algebra/score/simplified/SimpleScoringAlgebra";
import { ExpressionEvaluator } from "./algebra/score/simplified/ExpressionEvaluator";
import { CmpOp } from "./ast/CmpOp";
import {
    Expression,
    MetricCmpExpression,
    ConstScoreExpression,
    IfThenElseExpression,
    SumExpression,
} from "./ast/Expression";
import { Metric } from "./ast/Metric";
import { WindowContext } from "./context/WindowContext";

function yearlyAndQuarterlyRule(): Expression {
    const highTurnoverRule = new IfThenElseExpression(
        new MetricCmpExpression(Metric.YEARLY_PURCHASE_AMOUNT, CmpOp.GT, 10_000.0),
        new ConstScoreExpression(50),
        new ConstScoreExpression(0)
    );

    const tooManyComplaintsRule = new IfThenElseExpression(
        new MetricCmpExpression(Metric.QUARTERLY_COMPLAINT_COUNT, CmpOp.GT, 3.0),
        new ConstScoreExpression(-30),
        new ConstScoreExpression(0)
    );

    return new SumExpression([highTurnoverRule, tooManyComplaintsRule]);
}

describe("ExpressionEvaluator", () => {
    it("should evaluate with simplified ScoringAlgebra", () => {
        const metrics = new Map<Metric, number>();
        metrics.set(Metric.YEARLY_PURCHASE_AMOUNT, 20000.0);
        metrics.set(Metric.QUARTERLY_COMPLAINT_COUNT, 5.0);

        const ctx = new WindowContext(null, null, null, null, metrics);
        const rule = yearlyAndQuarterlyRule();
        const alg = new SimpleScoringAlgebra();

        const score = ExpressionEvaluator.evaluate(rule, ctx, alg);

        expect(score.equals(new Score(20))).toBe(true);
    });

    it("should evaluate with ScoreAlgebra via visitor", () => {
        const metrics = new Map<Metric, number>();
        metrics.set(Metric.YEARLY_PURCHASE_AMOUNT, 20000.0);
        metrics.set(Metric.QUARTERLY_COMPLAINT_COUNT, 5.0);

        const ctx = new WindowContext(null, null, null, null, metrics);
        const rule = yearlyAndQuarterlyRule();
        const visitor = new AlgebraicVisitor<Score>(ctx, new ScoreAlgebra());

        const score = rule.accept(visitor);

        expect(score.equals(new Score(20))).toBe(true);
    });
});
