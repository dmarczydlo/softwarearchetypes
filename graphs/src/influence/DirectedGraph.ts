/**
 * Simple directed graph implementation replacing jgrapht.
 * Supports vertex/edge management with string-key based equality.
 */
export class DirectedGraph<V> {
    private readonly vertices: Map<string, V> = new Map();
    private readonly edges: Map<string, { source: V; target: V }> = new Map();
    private readonly keyFn: (v: V) => string;

    constructor(keyFn: (v: V) => string) {
        this.keyFn = keyFn;
    }

    addVertex(vertex: V): void {
        const key = this.keyFn(vertex);
        if (!this.vertices.has(key)) {
            this.vertices.set(key, vertex);
        }
    }

    addEdge(source: V, target: V): void {
        this.addVertex(source);
        this.addVertex(target);
        const edgeKey = this.edgeKey(source, target);
        if (!this.edges.has(edgeKey)) {
            this.edges.set(edgeKey, { source, target });
        }
    }

    containsEdge(source: V, target: V): boolean {
        return this.edges.has(this.edgeKey(source, target));
    }

    vertexSet(): Set<V> {
        return new Set(this.vertices.values());
    }

    edgeEntries(): Array<{ source: V; target: V }> {
        return [...this.edges.values()];
    }

    edgeCount(): number {
        return this.edges.size;
    }

    /**
     * Get all outgoing edges from a vertex.
     */
    outgoingEdgesOf(vertex: V): Array<{ source: V; target: V }> {
        const key = this.keyFn(vertex);
        return [...this.edges.values()].filter(e => this.keyFn(e.source) === key);
    }

    /**
     * Get target vertex of an edge.
     */
    getEdgeTarget(edge: { source: V; target: V }): V {
        return edge.target;
    }

    /**
     * Get adjacent vertices (neighbors in an undirected sense).
     */
    neighborsOf(vertex: V): Set<V> {
        const key = this.keyFn(vertex);
        const neighbors = new Set<V>();
        for (const edge of this.edges.values()) {
            const sourceKey = this.keyFn(edge.source);
            const targetKey = this.keyFn(edge.target);
            if (sourceKey === key) {
                neighbors.set(this.keyFn(edge.target), edge.target);
            }
            if (targetKey === key) {
                neighbors.set(this.keyFn(edge.source), edge.source);
            }
        }
        // Convert internal map to Set<V>
        const result = new Set<V>();
        for (const edge of this.edges.values()) {
            const sourceKey = this.keyFn(edge.source);
            const targetKey = this.keyFn(edge.target);
            if (sourceKey === key) {
                result.add(edge.target);
            }
            if (targetKey === key) {
                result.add(edge.source);
            }
        }
        return result;
    }

    private edgeKey(source: V, target: V): string {
        return `${this.keyFn(source)}|${this.keyFn(target)}`;
    }
}

/**
 * Simple undirected graph implementation.
 */
export class SimpleGraph<V> {
    private readonly vertices: Map<string, V> = new Map();
    private readonly edges: Map<string, { v1: V; v2: V }> = new Map();
    private readonly keyFn: (v: V) => string;

    constructor(keyFn: (v: V) => string) {
        this.keyFn = keyFn;
    }

    addVertex(vertex: V): void {
        const key = this.keyFn(vertex);
        if (!this.vertices.has(key)) {
            this.vertices.set(key, vertex);
        }
    }

    addEdge(v1: V, v2: V): void {
        this.addVertex(v1);
        this.addVertex(v2);
        const edgeKey = this.edgeKey(v1, v2);
        if (!this.edges.has(edgeKey)) {
            this.edges.set(edgeKey, { v1, v2 });
        }
    }

    vertexSet(): Set<V> {
        return new Set(this.vertices.values());
    }

    /**
     * Find connected components using BFS.
     */
    connectedSets(): Set<V>[] {
        const visited = new Set<string>();
        const components: Set<V>[] = [];

        for (const [key, vertex] of this.vertices) {
            if (!visited.has(key)) {
                const component = new Set<V>();
                this.bfs(key, visited, component);
                components.push(component);
            }
        }

        return components;
    }

    /**
     * Find the connected set containing the given vertex.
     */
    connectedSetOf(vertex: V): Set<V> {
        const visited = new Set<string>();
        const component = new Set<V>();
        this.bfs(this.keyFn(vertex), visited, component);
        return component;
    }

    /**
     * Find articulation points (cut vertices) using Tarjan's algorithm.
     */
    findArticulationPoints(): Set<V> {
        const articulationPoints = new Set<V>();
        const visited = new Set<string>();
        const disc = new Map<string, number>();
        const low = new Map<string, number>();
        const parent = new Map<string, string | null>();
        let time = 0;

        const dfs = (uKey: string) => {
            let children = 0;
            visited.add(uKey);
            disc.set(uKey, time);
            low.set(uKey, time);
            time++;

            const neighbors = this.getNeighborKeys(uKey);
            for (const vKey of neighbors) {
                if (!visited.has(vKey)) {
                    children++;
                    parent.set(vKey, uKey);
                    dfs(vKey);

                    low.set(uKey, Math.min(low.get(uKey)!, low.get(vKey)!));

                    // u is an articulation point if:
                    // 1) u is root and has two or more children
                    if (parent.get(uKey) === null && children > 1) {
                        articulationPoints.add(this.vertices.get(uKey)!);
                    }
                    // 2) u is not root and low value of one of its child is >= disc value of u
                    if (parent.get(uKey) !== null && low.get(vKey)! >= disc.get(uKey)!) {
                        articulationPoints.add(this.vertices.get(uKey)!);
                    }
                } else if (vKey !== parent.get(uKey)) {
                    low.set(uKey, Math.min(low.get(uKey)!, disc.get(vKey)!));
                }
            }
        };

        for (const [key] of this.vertices) {
            if (!visited.has(key)) {
                parent.set(key, null);
                dfs(key);
            }
        }

        return articulationPoints;
    }

    private bfs(startKey: string, visited: Set<string>, component: Set<V>): void {
        const queue = [startKey];
        visited.add(startKey);
        const startVertex = this.vertices.get(startKey);
        if (startVertex) component.add(startVertex);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const neighbors = this.getNeighborKeys(current);

            for (const neighborKey of neighbors) {
                if (!visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    const vertex = this.vertices.get(neighborKey);
                    if (vertex) component.add(vertex);
                    queue.push(neighborKey);
                }
            }
        }
    }

    private getNeighborKeys(vertexKey: string): string[] {
        const neighbors: string[] = [];
        for (const edge of this.edges.values()) {
            const k1 = this.keyFn(edge.v1);
            const k2 = this.keyFn(edge.v2);
            if (k1 === vertexKey) {
                neighbors.push(k2);
            } else if (k2 === vertexKey) {
                neighbors.push(k1);
            }
        }
        return neighbors;
    }

    private edgeKey(v1: V, v2: V): string {
        const k1 = this.keyFn(v1);
        const k2 = this.keyFn(v2);
        // Undirected: normalize edge key
        return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    }
}
