import { describe, it, expect } from 'vitest';
import { PhysicsProcess } from './PhysicsProcess.js';
import { PhysicsInfluence } from './PhysicsInfluence.js';
import { LaboratoryAdjacency } from './LaboratoryAdjacency.js';
import { InfluenceMap } from './InfluenceMap.js';
import { InfluenceAnalyzer } from './InfluenceAnalyzer.js';
import { Reservation } from './Reservation.js';
import { THERMAL, CONDUCTIVITY, SPECTROSCOPY, LAB_A, LAB_B, LAB_C, emptyInfrastructure } from './Fixtures.js';

describe('InfluenceAnalyzer', () => {
    it('single direct conflict', () => {
        const physics = PhysicsInfluence.builder()
            .addInfluence(THERMAL, CONDUCTIVITY)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B]))
            .build();

        const existing = new Reservation(CONDUCTIVITY, LAB_B);
        const newReservation = new Reservation(THERMAL, LAB_A);

        const conflicts = new InfluenceAnalyzer(influenceMap).countConflicts(newReservation, new Set([existing]));

        expect(conflicts).toBe(1);
    });

    it('multiple direct conflicts', () => {
        const physics = PhysicsInfluence.builder()
            .addInfluence(THERMAL, CONDUCTIVITY)
            .addInfluence(THERMAL, SPECTROSCOPY)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B, LAB_C]))
            .build();

        const existing1 = new Reservation(CONDUCTIVITY, LAB_B);
        const existing2 = new Reservation(SPECTROSCOPY, LAB_C);
        const newReservation = new Reservation(THERMAL, LAB_A);

        const conflicts = new InfluenceAnalyzer(influenceMap).countConflicts(newReservation, new Set([existing1, existing2]));

        expect(conflicts).toBe(2);
    });

    it('no direct conflicts when no influence', () => {
        const physics = PhysicsInfluence.builder().build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B]))
            .build();

        const existing = new Reservation(SPECTROSCOPY, LAB_B);
        const newReservation = new Reservation(THERMAL, LAB_A);

        const conflicts = new InfluenceAnalyzer(influenceMap).countConflicts(newReservation, new Set([existing]));

        expect(conflicts).toBe(0);
    });

    it('new reservation merges two influence zones into one', () => {
        const processA = new PhysicsProcess('A');
        const processB = new PhysicsProcess('B');
        const processX = new PhysicsProcess('X');
        const processC = new PhysicsProcess('C');
        const processD = new PhysicsProcess('D');

        const physics = PhysicsInfluence.builder()
            .addInfluence(processA, processB)
            .addInfluence(processC, processD)
            .addInfluence(processB, processX)
            .addInfluence(processX, processC)
            .build();

        const adjacency = LaboratoryAdjacency.builder()
            .adjacent(LAB_A, LAB_A)
            .adjacent(LAB_B, LAB_B)
            .adjacent(LAB_A, LAB_C)
            .adjacent(LAB_C, LAB_B)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratoryAdjacency(adjacency)
            .build();

        const existing1 = new Reservation(processA, LAB_A);
        const existing2 = new Reservation(processB, LAB_A);
        const existing3 = new Reservation(processC, LAB_B);
        const existing4 = new Reservation(processD, LAB_B);
        const newReservation = new Reservation(processX, LAB_C);

        const zonesBefore = new InfluenceAnalyzer(influenceMap).analyzeInfluenceZones(new Set([existing1, existing2, existing3, existing4]));
        const zoneAfter = new InfluenceAnalyzer(influenceMap).findInfluenceZone(newReservation, new Set([existing1, existing2, existing3, existing4, newReservation]));

        expect(zonesBefore.size).toBe(2);
        expect(zoneAfter.size()).toBe(5);
        expect(zoneAfter.countReservationsToNegotiateWith(newReservation)).toBe(4);

        const toNegotiate = zoneAfter.getReservationsToNegotiateWith(newReservation);
        expect(toNegotiate.size).toBe(4);
    });

    it('new reservation adds third independent influence zone', () => {
        const processA = new PhysicsProcess('A');
        const processB = new PhysicsProcess('B');
        const processC = new PhysicsProcess('C');
        const processD = new PhysicsProcess('D');
        const processE = new PhysicsProcess('E');

        const physics = PhysicsInfluence.builder()
            .addInfluence(processA, processB)
            .addInfluence(processC, processD)
            .build();

        const influenceMap = InfluenceMap.builder()
            .withPhysics(physics)
            .withInfrastructure(emptyInfrastructure())
            .withLaboratories(new Set([LAB_A, LAB_B, LAB_C]))
            .build();

        const existing1 = new Reservation(processA, LAB_A);
        const existing2 = new Reservation(processB, LAB_A);
        const existing3 = new Reservation(processC, LAB_B);
        const existing4 = new Reservation(processD, LAB_B);
        const newReservation = new Reservation(processE, LAB_C);

        const zonesBefore = new InfluenceAnalyzer(influenceMap).analyzeInfluenceZones(new Set([existing1, existing2, existing3, existing4]));
        const zonesAfter = new InfluenceAnalyzer(influenceMap).analyzeInfluenceZones(new Set([existing1, existing2, existing3, existing4, newReservation]));
        const independentZone = new InfluenceAnalyzer(influenceMap).findInfluenceZone(newReservation, new Set([existing1, existing2, existing3, existing4, newReservation]));

        expect(zonesBefore.size).toBe(2);
        expect(zonesAfter.size).toBe(3);
        expect(independentZone.countReservationsToNegotiateWith(newReservation)).toBe(0);
        expect(independentZone.size()).toBe(1);
    });
});
