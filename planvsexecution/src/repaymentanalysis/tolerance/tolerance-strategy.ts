import { Payment } from "../payment";
import { MatchResult } from "./match-result";

export interface ToleranceStrategy {
    matches(planned: Payment, actual: Payment[]): MatchResult;
}

export function andStrategy(a: ToleranceStrategy, b: ToleranceStrategy): ToleranceStrategy {
    return {
        matches(planned: Payment, actual: Payment[]): MatchResult {
            const resultA = a.matches(planned, actual);
            if (!resultA.matched) {
                return resultA;
            }
            const resultB = b.matches(planned, actual);
            if (!resultB.matched) {
                return resultB;
            }
            return MatchResult.matchedResult(
                `Both criteria matched: ${resultA.reason} and ${resultB.reason}`
            );
        }
    };
}

export function orStrategy(a: ToleranceStrategy, b: ToleranceStrategy): ToleranceStrategy {
    return {
        matches(planned: Payment, actual: Payment[]): MatchResult {
            const resultA = a.matches(planned, actual);
            if (resultA.matched) {
                return resultA;
            }
            const resultB = b.matches(planned, actual);
            if (resultB.matched) {
                return resultB;
            }
            return MatchResult.notMatched(
                `Neither criteria matched: ${resultA.reason} or ${resultB.reason}`
            );
        }
    };
}

export function negateStrategy(a: ToleranceStrategy): ToleranceStrategy {
    return {
        matches(planned: Payment, actual: Payment[]): MatchResult {
            const result = a.matches(planned, actual);
            if (result.matched) {
                return MatchResult.notMatched("Negated: " + result.reason);
            } else {
                return MatchResult.matchedResult("Negated: " + result.reason);
            }
        }
    };
}
