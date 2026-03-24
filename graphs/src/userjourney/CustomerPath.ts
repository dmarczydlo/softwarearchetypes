import { Condition } from './Condition.js';

export class CustomerPath {
    readonly conditions: readonly Condition[];

    private constructor(conditions: Condition[]) {
        this.conditions = Object.freeze([...conditions]);
    }

    static of(conditions: Condition[]): CustomerPath {
        return new CustomerPath(conditions);
    }

    length(): number {
        return this.conditions.length;
    }

    isEmpty(): boolean {
        return this.conditions.length === 0;
    }

    weight(weightFunction: (condition: Condition) => number): number {
        return this.conditions.reduce((sum, c) => sum + weightFunction(c), 0);
    }

    key(): string {
        return this.conditions.map(c => c.key()).join('->');
    }

    equals(other: CustomerPath): boolean {
        return this.key() === other.key();
    }
}
