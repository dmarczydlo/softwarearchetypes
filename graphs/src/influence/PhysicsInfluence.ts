import { PhysicsProcess } from './PhysicsProcess.js';
import { DirectedGraph } from './DirectedGraph.js';

export class PhysicsInfluence {
    private readonly graph: DirectedGraph<PhysicsProcess>;
    private readonly edgeFeatureRequirements: Map<string, Map<string, number>>;

    private constructor(graph: DirectedGraph<PhysicsProcess>, edgeFeatureRequirements: Map<string, Map<string, number>>) {
        this.graph = graph;
        this.edgeFeatureRequirements = edgeFeatureRequirements;
    }

    static builder(): PhysicsInfluenceBuilder {
        return new PhysicsInfluenceBuilder();
    }

    asGraph(): DirectedGraph<PhysicsProcess> {
        return this.graph;
    }

    getFeatureRequirements(from: PhysicsProcess, to: PhysicsProcess): Map<string, number> {
        const key = `${from.name}|${to.name}`;
        return this.edgeFeatureRequirements.get(key) ?? new Map();
    }

    static _create(graph: DirectedGraph<PhysicsProcess>, edgeFeatureRequirements: Map<string, Map<string, number>>): PhysicsInfluence {
        return new PhysicsInfluence(graph, edgeFeatureRequirements);
    }
}

export class PhysicsInfluenceBuilder {
    private readonly graph = new DirectedGraph<PhysicsProcess>(p => p.name);
    private readonly edgeFeatureRequirements = new Map<string, Map<string, number>>();

    addInfluence(from: PhysicsProcess, to: PhysicsProcess, featureRequirements?: Map<string, number>): PhysicsInfluenceBuilder {
        this.graph.addEdge(from, to);
        if (featureRequirements) {
            const key = `${from.name}|${to.name}`;
            this.edgeFeatureRequirements.set(key, new Map(featureRequirements));
        }
        return this;
    }

    build(): PhysicsInfluence {
        return PhysicsInfluence._create(this.graph, this.edgeFeatureRequirements);
    }
}
