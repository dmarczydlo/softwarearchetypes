import { BinaryLogicalPredicate } from "./BinaryLogicalPredicate";
import { LogicalPredicate } from "./LogicalPredicate";

export class AndPredicate<T> extends BinaryLogicalPredicate<T> {
    constructor(left: LogicalPredicate<T>, right: LogicalPredicate<T>) {
        super(left, right);
    }

    test(value: T): boolean {
        return this.left().test(value) && this.right().test(value);
    }
}
