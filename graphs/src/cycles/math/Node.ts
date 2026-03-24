export class Node<T> {
    constructor(readonly property: T) {}

    toString(): string {
        return String(this.property);
    }

    equals(other: Node<T>): boolean {
        if (this.property instanceof Object && 'equals' in this.property) {
            return (this.property as { equals(o: unknown): boolean }).equals(other.property);
        }
        return this.property === other.property;
    }
}
