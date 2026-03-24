import { LogicalPredicate } from "./LogicalPredicate";
import { AndPredicate } from "./AndPredicate";
import { OrPredicate } from "./OrPredicate";
import { NotPredicate } from "./NotPredicate";

export abstract class RichLogicalPredicate<T> implements LogicalPredicate<T> {
    abstract test(value: T): boolean;

    and(other: LogicalPredicate<T>): LogicalPredicate<T> {
        return new AndPredicate<T>(this, other);
    }

    or(other: LogicalPredicate<T>): LogicalPredicate<T> {
        return new OrPredicate<T>(this, other);
    }

    not(): LogicalPredicate<T> {
        return new NotPredicate<T>(this);
    }
}
