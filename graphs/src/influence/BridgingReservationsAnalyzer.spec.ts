import { describe, it, expect } from 'vitest';
import { PhysicsProcess } from './PhysicsProcess.js';
import { PhysicsInfluence } from './PhysicsInfluence.js';
import { InfluenceMap } from './InfluenceMap.js';
import { InfluenceAnalyzer } from './InfluenceAnalyzer.js';
import { Reservation } from './Reservation.js';
import { LAB_A, LAB_B, LAB_C, emptyInfrastructure } from './Fixtures.js';

const PROCESS_A = new PhysicsProcess('A');
const PROCESS_B = new PhysicsProcess('B');
const PROCESS_C = new PhysicsProcess('D');
const PROCESS_D = new PhysicsProcess('C');

describe('BridgingReservationsAnalyzer', () => {
    it('independent reservations are not critical', () => {
        const processA = new PhysicsProcess('A');
        const processB = new PhysicsProcess('B');
        const processC = new PhysicsProcess('C');

        const physics = PhysicsInfluence.builder()
            .addInfluence(processA, processB)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B, LAB_C]))
            .build();

        const r1 = new Reservation(processA, LAB_A);
        const r2 = new Reservation(processB, LAB_B);
        const r3 = new Reservation(processC, LAB_C);

        const bridging = new InfluenceAnalyzer(influenceMap)
            .identifyCriticalReservations(new Set([r1, r2, r3]));

        expect(bridging.isEmpty()).toBe(true);
    });

    it('reservation connecting two groups is critical', () => {
        const processA = new PhysicsProcess('A');
        const processB = new PhysicsProcess('B');
        const processC = new PhysicsProcess('C');
        const processX = new PhysicsProcess('X');
        const processD = new PhysicsProcess('D');
        const processE = new PhysicsProcess('E');
        const processF = new PhysicsProcess('F');

        const physics = PhysicsInfluence.builder()
            .addInfluence(processA, processB)
            .addInfluence(processB, processC)
            .addInfluence(processC, processA)
            .addInfluence(processA, processX)
            .addInfluence(processX, processD)
            .addInfluence(processD, processE)
            .addInfluence(processE, processF)
            .addInfluence(processF, processD)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B, LAB_C]))
            .build();

        const r1 = new Reservation(processA, LAB_A);
        const r2 = new Reservation(processB, LAB_A);
        const r3 = new Reservation(processC, LAB_A);
        const r4 = new Reservation(processX, LAB_B);
        const r5 = new Reservation(processD, LAB_C);
        const r6 = new Reservation(processE, LAB_C);
        const r7 = new Reservation(processF, LAB_C);

        const bridging = new InfluenceAnalyzer(influenceMap)
            .identifyCriticalReservations(new Set([r1, r2, r3, r4, r5, r6, r7]));

        expect(bridging.count()).toBe(3);
        expect(bridging.isBridging(r4)).toBe(true);
        expect(bridging.isBridging(r1)).toBe(true);
        expect(bridging.isBridging(r5)).toBe(true);
    });

    it('fully connected group has no critical reservations', () => {
        const processA = new PhysicsProcess('A');
        const processB = new PhysicsProcess('B');
        const processC = new PhysicsProcess('C');

        const physics = PhysicsInfluence.builder()
            .addInfluence(processA, processB)
            .addInfluence(processB, processC)
            .addInfluence(processC, processA)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B, LAB_C]))
            .build();

        const r1 = new Reservation(processA, LAB_A);
        const r2 = new Reservation(processB, LAB_B);
        const r3 = new Reservation(processC, LAB_C);

        const bridging = new InfluenceAnalyzer(influenceMap)
            .identifyCriticalReservations(new Set([r1, r2, r3]));

        expect(bridging.isEmpty()).toBe(true);
        expect(bridging.count()).toBe(0);
    });

    it('long chain has multiple critical reservations', () => {
        const physics = PhysicsInfluence.builder()
            .addInfluence(PROCESS_A, PROCESS_B)
            .addInfluence(PROCESS_B, PROCESS_C)
            .addInfluence(PROCESS_C, PROCESS_D)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withLaboratories(new Set([LAB_A, LAB_B, LAB_C]))
            .build();

        const r1 = new Reservation(PROCESS_A, LAB_A);
        const r2 = new Reservation(PROCESS_B, LAB_B);
        const r3 = new Reservation(PROCESS_C, LAB_C);
        const r4 = new Reservation(PROCESS_D, LAB_A);

        const bridging = new InfluenceAnalyzer(influenceMap)
            .identifyCriticalReservations(new Set([r1, r2, r3, r4]));

        expect(bridging.count()).toBe(2);
        expect(bridging.isBridging(r2)).toBe(true);
        expect(bridging.isBridging(r3)).toBe(true);
    });

    it('empty set has no critical reservations', () => {
        const physics = PhysicsInfluence.builder().build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A]))
            .build();

        const bridging = new InfluenceAnalyzer(influenceMap)
            .identifyCriticalReservations(new Set());

        expect(bridging.isEmpty()).toBe(true);
        expect(bridging.count()).toBe(0);
    });
});
