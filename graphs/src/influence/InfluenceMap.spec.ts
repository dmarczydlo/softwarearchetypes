import { describe, it } from 'vitest';
import { PhysicsInfluence } from './PhysicsInfluence.js';
import { InfrastructureInfluence } from './InfrastructureInfluence.js';
import { LaboratoryAdjacency } from './LaboratoryAdjacency.js';
import { InfluenceMap } from './InfluenceMap.js';
import { InfluenceMapAssert } from './InfluenceMapAssert.js';
import { THERMAL, CONDUCTIVITY, SPECTROSCOPY, LAB_A, LAB_B, LAB_C, emptyInfrastructure } from './Fixtures.js';

const { assertThat } = InfluenceMapAssert;

describe('InfluenceMap', () => {
    it('should create influence graph as cartesian product of physics and laboratories', () => {
        const physics = PhysicsInfluence.builder()
            .addInfluence(THERMAL, CONDUCTIVITY)
            .build();

        const labs = new Set([LAB_A, LAB_B, LAB_C]);
        const infrastructureInfluence = emptyInfrastructure();

        const influence = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(infrastructureInfluence)
            .withLaboratories(labs)
            .build();

        assertThat(influence)
            .hasEdge(THERMAL, LAB_A, CONDUCTIVITY, LAB_A)
            .hasEdge(THERMAL, LAB_A, CONDUCTIVITY, LAB_B)
            .hasEdge(THERMAL, LAB_A, CONDUCTIVITY, LAB_C)
            .hasEdge(THERMAL, LAB_B, CONDUCTIVITY, LAB_A)
            .hasEdge(THERMAL, LAB_B, CONDUCTIVITY, LAB_B)
            .hasEdge(THERMAL, LAB_B, CONDUCTIVITY, LAB_C)
            .hasEdge(THERMAL, LAB_C, CONDUCTIVITY, LAB_A)
            .hasEdge(THERMAL, LAB_C, CONDUCTIVITY, LAB_B)
            .hasEdge(THERMAL, LAB_C, CONDUCTIVITY, LAB_C)
            .hasEdgeCount(9);
    });

    it('should combine physics cartesian product with infrastructure constraints', () => {
        const physics = PhysicsInfluence.builder()
            .addInfluence(THERMAL, CONDUCTIVITY)
            .build();

        const labs = new Set([LAB_A, LAB_B]);

        const infrastructureInfluence = InfrastructureInfluence.builder()
            .addConstraint(SPECTROSCOPY, LAB_A, THERMAL, LAB_B)
            .build();

        const influence = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(infrastructureInfluence)
            .withLaboratories(labs)
            .build();

        assertThat(influence)
            .hasEdge(THERMAL, LAB_A, CONDUCTIVITY, LAB_A)
            .hasEdge(THERMAL, LAB_A, CONDUCTIVITY, LAB_B)
            .hasEdge(THERMAL, LAB_B, CONDUCTIVITY, LAB_A)
            .hasEdge(THERMAL, LAB_B, CONDUCTIVITY, LAB_B)
            .hasEdge(SPECTROSCOPY, LAB_A, THERMAL, LAB_B)
            .hasEdgeCount(5);
    });

    it('should create influence graph based on laboratory adjacency', () => {
        const physics = PhysicsInfluence.builder()
            .addInfluence(THERMAL, CONDUCTIVITY)
            .build();

        const adjacency = LaboratoryAdjacency.builder()
            .adjacent(LAB_A, LAB_B)
            .adjacent(LAB_B, LAB_C)
            .build();

        const infrastructureInfluence = emptyInfrastructure();

        const influence = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(infrastructureInfluence)
            .withLaboratoryAdjacency(adjacency)
            .build();

        assertThat(influence)
            .hasEdge(THERMAL, LAB_A, CONDUCTIVITY, LAB_B)
            .hasEdge(THERMAL, LAB_B, CONDUCTIVITY, LAB_C)
            .hasEdgeCount(2);
    });
});
