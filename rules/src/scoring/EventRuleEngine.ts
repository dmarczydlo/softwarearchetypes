import { Algebra } from "./algebra/Algebra";
import { AlgebraicVisitor } from "./algebra/AlgebraicVisitor";
import { Score } from "./algebra/score/Score";
import { EventRule } from "./ast/EventRule";
import { ExpressionVisitor } from "./ast/Expression";
import { EventWindowContext } from "./context/EventWindowContext";
import { WindowContext } from "./context/WindowContext";

export class EventRuleEngine {
    private readonly filterAlgebra: Algebra<Score>;
    private readonly scoreAlgebra: Algebra<Score>;

    constructor(filterAlgebra: Algebra<Score>, scoreAlgebra: Algebra<Score>) {
        this.filterAlgebra = filterAlgebra;
        this.scoreAlgebra = scoreAlgebra;
    }

    evaluateRules(rules: EventRule[], ctx: WindowContext): Score {
        let total = Score.ZERO;
        const filterVisitor: ExpressionVisitor<Score> = new AlgebraicVisitor<Score>(ctx, this.filterAlgebra);
        const events = ctx.getEvents();
        if (!events) return total;

        for (const event of events) {
            const evCtx = new EventWindowContext(ctx, event);
            const scoreVisitor: ExpressionVisitor<Score> = new AlgebraicVisitor<Score>(evCtx, this.scoreAlgebra);
            for (const rule of rules) {
                const filterExpression = rule.filterExpr;
                const condScore = filterExpression.accept(filterVisitor);
                if (condScore.value > 0) {
                    const scoreExpression = rule.scoreExpr;
                    const s = scoreExpression.accept(scoreVisitor);
                    total = total.plus(s);
                }
            }
        }
        return total;
    }
}
