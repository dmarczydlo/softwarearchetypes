import { Calculator } from "./Calculator.js";
import { CalculatorId } from "./CalculatorId.js";
import { CalculatorType } from "./CalculatorType.js";

export class CalculatorView {
    constructor(
        readonly calculatorId: CalculatorId,
        readonly name: string,
        readonly type: CalculatorType,
        readonly description: string
    ) {}

    static from(calc: Calculator): CalculatorView {
        return new CalculatorView(calc.getId(), calc.name(), calc.getType(), calc.describe());
    }
}
