import { Expression } from "./Expression";

export class EventRule {
    readonly filterExpr: Expression;
    readonly scoreExpr: Expression;

    constructor(filterExpr: Expression, scoreExpr: Expression) {
        this.filterExpr = filterExpr;
        this.scoreExpr = scoreExpr;
    }
}
