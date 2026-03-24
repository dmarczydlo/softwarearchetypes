import { Preconditions } from "@softwarearchetypes/common";
import { ProductSet } from "./product-set";
import { SelectedProduct } from "./selected-product";

export interface SelectionRule {
    isSatisfiedBy(selection: SelectedProduct[]): boolean;
}

export class IsSubsetOf implements SelectionRule {
    readonly sourceSet: ProductSet;
    readonly min: number;
    readonly max: number;

    constructor(sourceSet: ProductSet, min: number, max: number) {
        Preconditions.checkArgument(sourceSet != null, "ProductSet must be defined");
        Preconditions.checkArgument(min >= 0, "Min must be >= 0");
        Preconditions.checkArgument(max >= min, "Max must be >= min");
        this.sourceSet = sourceSet;
        this.min = min;
        this.max = max;
    }

    isSatisfiedBy(selection: SelectedProduct[]): boolean {
        let count = 0;
        for (const s of selection) {
            if (this.sourceSet.contains(s.productId)) {
                count += s.quantity;
            }
        }
        return count >= this.min && count <= this.max;
    }

    toString(): string {
        return `IsSubsetOf{set='${this.sourceSet.name()}', min=${this.min}, max=${this.max}}`;
    }
}

export class AndRule implements SelectionRule {
    readonly rules: SelectionRule[];

    constructor(rules: SelectionRule[]) {
        Preconditions.checkArgument(rules != null && rules.length > 0, "Rules cannot be empty");
        this.rules = rules;
    }

    isSatisfiedBy(selection: SelectedProduct[]): boolean {
        return this.rules.every(r => r.isSatisfiedBy(selection));
    }

    toString(): string {
        return `AND(${this.rules.length} rules)`;
    }
}

export class OrRule implements SelectionRule {
    readonly rules: SelectionRule[];

    constructor(rules: SelectionRule[]) {
        Preconditions.checkArgument(rules != null && rules.length > 0, "Rules cannot be empty");
        this.rules = rules;
    }

    isSatisfiedBy(selection: SelectedProduct[]): boolean {
        return this.rules.some(r => r.isSatisfiedBy(selection));
    }

    toString(): string {
        return `OR(${this.rules.length} rules)`;
    }
}

export class NotRule implements SelectionRule {
    readonly rule: SelectionRule;

    constructor(rule: SelectionRule) {
        Preconditions.checkArgument(rule != null, "Rule must be defined");
        this.rule = rule;
    }

    isSatisfiedBy(selection: SelectedProduct[]): boolean {
        return !this.rule.isSatisfiedBy(selection);
    }

    toString(): string {
        return `NOT(${this.rule})`;
    }
}

export class ConditionalRule implements SelectionRule {
    readonly condition: SelectionRule;
    readonly thenRules: SelectionRule[];

    constructor(condition: SelectionRule, thenRules: SelectionRule[]) {
        Preconditions.checkArgument(condition != null, "Condition must be defined");
        Preconditions.checkArgument(thenRules != null && thenRules.length > 0, "Then rules cannot be empty");
        this.condition = condition;
        this.thenRules = thenRules;
    }

    isSatisfiedBy(selection: SelectedProduct[]): boolean {
        if (this.condition.isSatisfiedBy(selection)) {
            return this.thenRules.every(r => r.isSatisfiedBy(selection));
        }
        return true;
    }

    toString(): string {
        return `IF(${this.condition}) THEN(${this.thenRules.length} rules)`;
    }
}

export const SelectionRuleFactory = {
    isSubsetOf(sourceSet: ProductSet, min: number, max: number): SelectionRule {
        return new IsSubsetOf(sourceSet, min, max);
    },
    single(sourceSet: ProductSet): SelectionRule {
        return new IsSubsetOf(sourceSet, 1, 1);
    },
    optional(sourceSet: ProductSet): SelectionRule {
        return new IsSubsetOf(sourceSet, 0, 1);
    },
    required(sourceSet: ProductSet): SelectionRule {
        return new IsSubsetOf(sourceSet, 1, Number.MAX_SAFE_INTEGER);
    },
    and(...rules: SelectionRule[]): SelectionRule {
        return new AndRule(rules);
    },
    or(...rules: SelectionRule[]): SelectionRule {
        return new OrRule(rules);
    },
    not(rule: SelectionRule): SelectionRule {
        return new NotRule(rule);
    },
    ifThen(condition: SelectionRule, ...thenRules: SelectionRule[]): SelectionRule {
        return new ConditionalRule(condition, thenRules);
    }
};
