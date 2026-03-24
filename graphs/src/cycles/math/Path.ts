import { Edge } from './Edge.js';

export class Path<T, P> {
    readonly edges: Edge<T, P>[];

    constructor(edges: Edge<T, P>[]) {
        this.edges = [...edges];
    }

    toString(): string {
        if (this.edges.length === 0) {
            return '-';
        }
        const rest = this.edges.map(edge => edge.to.toString()).join(' -> ');
        return `${this.edges[0].from} -> ${rest}`;
    }
}
