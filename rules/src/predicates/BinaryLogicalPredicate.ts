import { LogicalPredicate } from "./LogicalPredicate";

export abstract class BinaryLogicalPredicate<T> implements LogicalPredicate<T> {
    private readonly _left: LogicalPredicate<T>;
    private readonly _right: LogicalPredicate<T>;

    protected constructor(left: LogicalPredicate<T>, right: LogicalPredicate<T>) {
        this._left = left;
        this._right = right;
    }

    left(): LogicalPredicate<T> {
        return this._left;
    }

    right(): LogicalPredicate<T> {
        return this._right;
    }

    abstract test(value: T): boolean;
}
