import { Node } from './Node.js';
import { Edge } from './Edge.js';
import { Path } from './Path.js';

export class Graph<T, P> {
    private readonly adjacencyMatrix: Map<string, { node: Node<T>; edges: Edge<T, P>[] }> = new Map();

    private nodeKey(node: Node<T>): string {
        const prop = node.property;
        if (prop instanceof Object && 'value' in prop) {
            return String((prop as { value: unknown }).value);
        }
        return String(prop);
    }

    addEdge(edge: Edge<T, P>): Graph<T, P> {
        const fromKey = this.nodeKey(edge.from);
        const toKey = this.nodeKey(edge.to);

        if (!this.adjacencyMatrix.has(fromKey)) {
            this.adjacencyMatrix.set(fromKey, { node: edge.from, edges: [] });
        }
        this.adjacencyMatrix.get(fromKey)!.edges.push(edge);

        if (!this.adjacencyMatrix.has(toKey)) {
            this.adjacencyMatrix.set(toKey, { node: edge.to, edges: [] });
        }

        return this;
    }

    findFirstCycle(): Path<T, P> | null {
        const visited = new Set<string>();
        const inStack = new Set<string>();

        for (const [key] of this.adjacencyMatrix) {
            if (!visited.has(key)) {
                const cycle = this.findCycleDFS(key, visited, inStack, []);
                if (cycle !== null) {
                    return cycle;
                }
            }
        }
        return null;
    }

    private findCycleDFS(
        currentKey: string,
        visited: Set<string>,
        inStack: Set<string>,
        path: Edge<T, P>[]
    ): Path<T, P> | null {
        visited.add(currentKey);
        inStack.add(currentKey);

        const entry = this.adjacencyMatrix.get(currentKey);
        const edges = entry ? entry.edges : [];

        for (const edge of edges) {
            const neighborKey = this.nodeKey(edge.to);

            if (inStack.has(neighborKey)) {
                const cycle: Edge<T, P>[] = [];
                let foundStart = false;
                for (const pathEdge of path) {
                    if (this.nodeKey(pathEdge.from) === neighborKey || foundStart) {
                        foundStart = true;
                        cycle.push(pathEdge);
                    }
                }
                cycle.push(edge);
                return new Path(cycle);
            }

            if (!visited.has(neighborKey)) {
                path.push(edge);
                const cycle = this.findCycleDFS(neighborKey, visited, inStack, path);
                if (cycle !== null) {
                    return cycle;
                }
                path.pop();
            }
        }

        inStack.delete(currentKey);
        return null;
    }

    hasEdge(from: Node<T>, to: Node<T>): boolean {
        const fromKey = this.nodeKey(from);
        const entry = this.adjacencyMatrix.get(fromKey);
        if (!entry) {
            return false;
        }
        const toKey = this.nodeKey(to);
        return entry.edges.some(edge => this.nodeKey(edge.to) === toKey);
    }

    intersection<P2>(other: Graph<T, P2>): Graph<T, P> {
        const result = new Graph<T, P>();

        for (const [, entry] of this.adjacencyMatrix) {
            for (const edge of entry.edges) {
                if (other.hasEdge(edge.from, edge.to)) {
                    result.addEdge(edge);
                }
            }
        }

        return result;
    }

    removeEdge(edge: Edge<T, P>): void {
        const fromKey = this.nodeKey(edge.from);
        const entry = this.adjacencyMatrix.get(fromKey);
        if (entry) {
            const toKey = this.nodeKey(edge.to);
            entry.edges = entry.edges.filter(e => this.nodeKey(e.to) !== toKey);
        }
    }
}
