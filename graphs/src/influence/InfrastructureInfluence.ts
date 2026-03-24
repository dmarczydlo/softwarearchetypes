import { PhysicsProcess } from './PhysicsProcess.js';
import { Laboratory } from './Laboratory.js';
import { InfluenceUnit } from './InfluenceUnit.js';
import { DirectedGraph } from './DirectedGraph.js';

export class InfrastructureInfluence {
    private readonly graph: DirectedGraph<InfluenceUnit>;

    private constructor(graph: DirectedGraph<InfluenceUnit>) {
        this.graph = graph;
    }

    static builder(): InfrastructureInfluenceBuilder {
        return new InfrastructureInfluenceBuilder();
    }

    asGraph(): DirectedGraph<InfluenceUnit> {
        return this.graph;
    }

    static _create(graph: DirectedGraph<InfluenceUnit>): InfrastructureInfluence {
        return new InfrastructureInfluence(graph);
    }
}

export class InfrastructureInfluenceBuilder {
    private readonly graph = new DirectedGraph<InfluenceUnit>(u => u.key());

    addConstraint(fromProcess: PhysicsProcess, fromLab: Laboratory,
                  toProcess: PhysicsProcess, toLab: Laboratory): InfrastructureInfluenceBuilder {
        const from = new InfluenceUnit(fromProcess, fromLab);
        const to = new InfluenceUnit(toProcess, toLab);
        this.graph.addEdge(from, to);
        return this;
    }

    build(): InfrastructureInfluence {
        return InfrastructureInfluence._create(this.graph);
    }
}
