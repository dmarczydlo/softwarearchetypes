import { Laboratory } from './Laboratory.js';
import { DirectedGraph } from './DirectedGraph.js';

export class LaboratoryAdjacency {
    private readonly graph: DirectedGraph<Laboratory>;

    private constructor(graph: DirectedGraph<Laboratory>) {
        this.graph = graph;
    }

    static builder(): LaboratoryAdjacencyBuilder {
        return new LaboratoryAdjacencyBuilder();
    }

    asGraph(): DirectedGraph<Laboratory> {
        return this.graph;
    }

    static _create(graph: DirectedGraph<Laboratory>): LaboratoryAdjacency {
        return new LaboratoryAdjacency(graph);
    }
}

export class LaboratoryAdjacencyBuilder {
    private readonly graph = new DirectedGraph<Laboratory>(l => l.name);

    adjacent(from: Laboratory, to: Laboratory): LaboratoryAdjacencyBuilder {
        this.graph.addEdge(from, to);
        return this;
    }

    build(): LaboratoryAdjacency {
        return LaboratoryAdjacency._create(this.graph);
    }
}
