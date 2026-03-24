import { Node } from './Node.js';

export class Edge<T, P> {
    readonly from: Node<T>;
    readonly to: Node<T>;
    readonly property: P;

    constructor(from: Node<T>, to: Node<T>, property?: P) {
        this.from = from;
        this.to = to;
        this.property = property as P;
    }

    toString(): string {
        return `${this.from} -> ${this.to}`;
    }
}
