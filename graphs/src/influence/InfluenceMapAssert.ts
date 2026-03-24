import { expect } from 'vitest';
import { InfluenceMap } from './InfluenceMap.js';
import { PhysicsProcess } from './PhysicsProcess.js';
import { Laboratory } from './Laboratory.js';
import { InfluenceUnit } from './InfluenceUnit.js';

export class InfluenceMapAssert {
    private readonly actual: InfluenceMap;

    private constructor(actual: InfluenceMap) {
        this.actual = actual;
    }

    static assertThat(actual: InfluenceMap): InfluenceMapAssert {
        return new InfluenceMapAssert(actual);
    }

    hasEdge(fromProcess: PhysicsProcess, fromLab: Laboratory,
            toProcess: PhysicsProcess, toLab: Laboratory): InfluenceMapAssert {
        expect(
            this.actual.asGraph().containsEdge(
                new InfluenceUnit(fromProcess, fromLab),
                new InfluenceUnit(toProcess, toLab)
            ),
            `Expected edge from (${fromProcess}, ${fromLab}) to (${toProcess}, ${toLab})`
        ).toBe(true);
        return this;
    }

    hasEdgeCount(expectedCount: number): InfluenceMapAssert {
        const actualCount = this.actual.asGraph().edgeCount();
        expect(actualCount, `Expected ${expectedCount} edges but found ${actualCount}`).toBe(expectedCount);
        return this;
    }
}
