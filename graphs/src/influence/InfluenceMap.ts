import { PhysicsProcess } from './PhysicsProcess.js';
import { Laboratory } from './Laboratory.js';
import { InfluenceUnit } from './InfluenceUnit.js';
import { Reservation } from './Reservation.js';
import { PhysicsInfluence } from './PhysicsInfluence.js';
import { InfrastructureInfluence } from './InfrastructureInfluence.js';
import { LaboratoryAdjacency } from './LaboratoryAdjacency.js';
import { DirectedGraph } from './DirectedGraph.js';

export class InfluenceMap {
    private readonly graph: DirectedGraph<InfluenceUnit>;

    private constructor(graph: DirectedGraph<InfluenceUnit>) {
        this.graph = graph;
    }

    static of(physicsInfluence: PhysicsInfluence,
              infrastructureInfluence: InfrastructureInfluence,
              laboratoriesOrAdjacency: Set<Laboratory> | LaboratoryAdjacency): InfluenceMap {
        let result: DirectedGraph<InfluenceUnit>;
        if (laboratoriesOrAdjacency instanceof LaboratoryAdjacency) {
            result = InfluenceMap.adjacencyOf(physicsInfluence, laboratoriesOrAdjacency);
        } else {
            result = InfluenceMap.cartesianOf(physicsInfluence, laboratoriesOrAdjacency);
        }
        InfluenceMap.addInfrastructure(infrastructureInfluence, result);
        return new InfluenceMap(result);
    }

    private static addInfrastructure(infrastructureInfluence: InfrastructureInfluence, result: DirectedGraph<InfluenceUnit>): void {
        const infra = infrastructureInfluence.asGraph();
        for (const edge of infra.edgeEntries()) {
            result.addEdge(edge.source, edge.target);
        }
    }

    private static cartesianOf(physicsInfluence: PhysicsInfluence, laboratories: Set<Laboratory>): DirectedGraph<InfluenceUnit> {
        const result = new DirectedGraph<InfluenceUnit>(u => u.key());
        const physics = physicsInfluence.asGraph();
        const labArray = [...laboratories];

        for (const edge of physics.edgeEntries()) {
            const sourceProcess = edge.source;
            const targetProcess = edge.target;
            for (const lab1 of labArray) {
                for (const lab2 of labArray) {
                    const from = new InfluenceUnit(sourceProcess, lab1);
                    const to = new InfluenceUnit(targetProcess, lab2);
                    result.addEdge(from, to);
                }
            }
        }
        return result;
    }

    private static adjacencyOf(physicsInfluence: PhysicsInfluence, laboratoryAdjacency: LaboratoryAdjacency): DirectedGraph<InfluenceUnit> {
        const result = new DirectedGraph<InfluenceUnit>(u => u.key());
        const physics = physicsInfluence.asGraph();
        const adjacency = laboratoryAdjacency.asGraph();

        for (const physicsEdge of physics.edgeEntries()) {
            const sourceProcess = physicsEdge.source;
            const targetProcess = physicsEdge.target;

            for (const adjacencyEdge of adjacency.edgeEntries()) {
                const lab1 = adjacencyEdge.source;
                const lab2 = adjacencyEdge.target;

                const from = new InfluenceUnit(sourceProcess, lab1);
                const to = new InfluenceUnit(targetProcess, lab2);
                result.addEdge(from, to);
            }
        }
        return result;
    }

    asGraph(): DirectedGraph<InfluenceUnit> {
        return this.graph;
    }

    influences(fromProcessOrReservation: PhysicsProcess | Reservation,
               fromLabOrReservation: Laboratory | Reservation,
               toProcess?: PhysicsProcess,
               toLab?: Laboratory): boolean {
        if (fromProcessOrReservation instanceof Reservation && fromLabOrReservation instanceof Reservation) {
            const from = fromProcessOrReservation;
            const to = fromLabOrReservation;
            return this.graph.containsEdge(
                new InfluenceUnit(from.process, from.laboratory),
                new InfluenceUnit(to.process, to.laboratory)
            );
        }
        return this.graph.containsEdge(
            new InfluenceUnit(fromProcessOrReservation as PhysicsProcess, fromLabOrReservation as Laboratory),
            new InfluenceUnit(toProcess!, toLab!)
        );
    }

    static builder(): InfluenceMapBuilder {
        return new InfluenceMapBuilder();
    }
}

export class InfluenceMapBuilder {
    private physicsInfluence: PhysicsInfluence | null = null;
    private infrastructureInfluence: InfrastructureInfluence = InfrastructureInfluence.builder().build();
    private laboratories: Set<Laboratory> | null = null;
    private laboratoryAdjacency: LaboratoryAdjacency | null = null;

    withPhysics(physicsInfluence: PhysicsInfluence): InfluenceMapBuilder {
        this.physicsInfluence = physicsInfluence;
        return this;
    }

    withInfrastructure(infrastructureInfluence: InfrastructureInfluence): InfluenceMapBuilder {
        this.infrastructureInfluence = infrastructureInfluence;
        return this;
    }

    withLaboratories(laboratories: Set<Laboratory>): InfluenceMapBuilder {
        this.laboratories = laboratories;
        return this;
    }

    withLaboratoryAdjacency(laboratoryAdjacency: LaboratoryAdjacency): InfluenceMapBuilder {
        this.laboratoryAdjacency = laboratoryAdjacency;
        return this;
    }

    build(): InfluenceMap {
        if (this.laboratoryAdjacency) {
            return InfluenceMap.of(this.physicsInfluence!, this.infrastructureInfluence, this.laboratoryAdjacency);
        }
        return InfluenceMap.of(this.physicsInfluence!, this.infrastructureInfluence, this.laboratories!);
    }
}
