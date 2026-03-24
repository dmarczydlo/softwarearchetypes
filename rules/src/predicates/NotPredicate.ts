import { LogicalPredicate } from "./LogicalPredicate";

export class NotPredicate<T> implements LogicalPredicate<T> {
    private readonly _child: LogicalPredicate<T>;

    constructor(child: LogicalPredicate<T>) {
        this._child = child;
    }

    child(): LogicalPredicate<T> {
        return this._child;
    }

    test(value: T): boolean {
        return !this._child.test(value);
    }
}
