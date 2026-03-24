export class MatchResult {
    readonly matched: boolean;
    readonly reason: string;

    constructor(matched: boolean, reason: string) {
        this.matched = matched;
        this.reason = reason;
    }

    static matchedResult(reason: string): MatchResult {
        return new MatchResult(true, reason);
    }

    static notMatched(reason: string): MatchResult {
        return new MatchResult(false, reason);
    }
}
