import { Reservation } from './Reservation.js';
import { InfluenceMap } from './InfluenceMap.js';
import { InfluenceZone } from './InfluenceZone.js';
import { BridgingReservations } from './BridgingReservations.js';
import { SimpleGraph } from './DirectedGraph.js';

export class InfluenceAnalyzer {
    private readonly influenceMap: InfluenceMap;

    constructor(influenceMap: InfluenceMap) {
        this.influenceMap = influenceMap;
    }

    countConflicts(newReservation: Reservation, existingReservations: Set<Reservation>): number {
        let conflicts = 0;
        for (const existing of existingReservations) {
            if (this.influenceMap.influences(newReservation, existing)) {
                conflicts++;
            }
        }
        return conflicts;
    }

    analyzeInfluenceZones(reservations: Set<Reservation>): Set<InfluenceZone> {
        const graph = this.buildInfluenceGraph(reservations);
        const components = graph.connectedSets();
        return new Set(components.map(component => new InfluenceZone(component)));
    }

    findInfluenceZone(reservation: Reservation, allReservations: Set<Reservation>): InfluenceZone {
        const graph = this.buildInfluenceGraph(allReservations);
        const connectedComponent = graph.connectedSetOf(reservation);
        return new InfluenceZone(connectedComponent);
    }

    identifyCriticalReservations(reservations: Set<Reservation>): BridgingReservations {
        const graph = this.buildInfluenceGraph(reservations);
        const articulationPoints = graph.findArticulationPoints();
        return new BridgingReservations(articulationPoints);
    }

    private buildInfluenceGraph(reservations: Set<Reservation>): SimpleGraph<Reservation> {
        const graph = new SimpleGraph<Reservation>(r => r.key());
        for (const reservation of reservations) {
            graph.addVertex(reservation);
        }
        const reservationArray = [...reservations];
        for (const r1 of reservationArray) {
            for (const r2 of reservationArray) {
                if (!r1.equals(r2) && this.influenceMap.influences(r1, r2)) {
                    graph.addEdge(r1, r2);
                }
            }
        }
        return graph;
    }
}
