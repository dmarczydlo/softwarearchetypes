// marker interface for reflection
export interface LogicalPredicate<T> {
    test(value: T): boolean;
}
