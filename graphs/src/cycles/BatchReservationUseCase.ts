import { Edge } from './math/Edge.js';
import { Graph } from './math/Graph.js';
import { Node } from './math/Node.js';
import { SlotId } from './SlotId.js';
import { OwnerId } from './OwnerId.js';
import { Slot } from './Slot.js';
import { ReservationChangeRequest } from './ReservationChangeRequest.js';
import { BatchReservationResult } from './BatchReservationResult.js';
import { SlotRepository } from './SlotRepository.js';
import { Eligibility } from './Eligibility.js';

export class BatchReservationUseCase {
    private readonly slotRepository: SlotRepository;

    constructor(slotRepository: SlotRepository) {
        this.slotRepository = slotRepository;
    }

    execute(requests: ReservationChangeRequest[], eligibility?: Eligibility): BatchReservationResult {
        if (eligibility) {
            return this.executeWithEligibility(requests, eligibility);
        }
        return this.executeWithoutEligibility(requests);
    }

    private executeWithoutEligibility(requests: ReservationChangeRequest[]): BatchReservationResult {
        const graph = this.buildGraph(requests);
        const dependentRequests = this.findDependentRequests(graph);
        if (dependentRequests.size > 0) {
            const slots = this.loadAllSlots(dependentRequests);
            for (const request of dependentRequests) {
                const fromSlot = this.findSlotInMap(slots, request.fromSlot);
                if (fromSlot) fromSlot.release();
            }
            for (const request of dependentRequests) {
                const toSlot = this.findSlotInMap(slots, request.toSlot);
                if (toSlot) toSlot.assignTo(request.userId);
            }
            this.slotRepository.saveAll(slots.values());
            return BatchReservationResult.success(dependentRequests);
        }
        return BatchReservationResult.none();
    }

    private executeWithEligibility(requests: ReservationChangeRequest[], eligibility: Eligibility): BatchReservationResult {
        const intersection = this.buildOwnerGraph(requests).intersection(eligibility.asGraph());
        const dependentRequests = this.findDependentRequestsInOwnerGraph(intersection);

        if (dependentRequests.size > 0) {
            const slots = this.loadAllSlots(dependentRequests);
            for (const request of dependentRequests) {
                const fromSlot = this.findSlotInMap(slots, request.fromSlot);
                if (fromSlot) fromSlot.release();
            }
            for (const request of dependentRequests) {
                const toSlot = this.findSlotInMap(slots, request.toSlot);
                if (toSlot) toSlot.assignTo(request.userId);
            }
            this.slotRepository.saveAll(slots.values());
            return BatchReservationResult.success(dependentRequests);
        }
        return BatchReservationResult.none();
    }

    private findSlotInMap(slots: Map<SlotId, Slot>, slotId: SlotId): Slot | undefined {
        for (const [key, slot] of slots) {
            if (key.value === slotId.value) {
                return slot;
            }
        }
        return undefined;
    }

    private buildGraph(requests: ReservationChangeRequest[]): Graph<SlotId, ReservationChangeRequest> {
        const graph = new Graph<SlotId, ReservationChangeRequest>();
        for (const request of requests) {
            const fromNode = new Node(request.fromSlot);
            const toNode = new Node(request.toSlot);
            const edge = new Edge(fromNode, toNode, request);
            graph.addEdge(edge);
        }
        return graph;
    }

    private loadAllSlots(dependentRequests: Set<ReservationChangeRequest>): Map<SlotId, Slot> {
        const allSlotIds = new Set<SlotId>();
        for (const r of dependentRequests) {
            allSlotIds.add(r.fromSlot);
            allSlotIds.add(r.toSlot);
        }
        return this.slotRepository.findAll(allSlotIds);
    }

    private buildOwnerGraph(requests: ReservationChangeRequest[]): Graph<OwnerId, ReservationChangeRequest> {
        const graph = new Graph<OwnerId, ReservationChangeRequest>();

        const allSlotIds = new Set<SlotId>();
        for (const r of requests) {
            allSlotIds.add(r.fromSlot);
            allSlotIds.add(r.toSlot);
        }
        const slots = this.slotRepository.findAll(allSlotIds);

        for (const request of requests) {
            const fromSlot = this.findSlotInMap(slots, request.fromSlot);
            const toSlot = this.findSlotInMap(slots, request.toSlot);

            if (fromSlot && toSlot) {
                const fromOwner = new Node(fromSlot.getOwner());
                const toOwner = new Node(toSlot.getOwner());
                const edge = new Edge(fromOwner, toOwner, request);
                graph.addEdge(edge);
            }
        }

        return graph;
    }

    private findDependentRequestsInOwnerGraph(graph: Graph<OwnerId, ReservationChangeRequest>): Set<ReservationChangeRequest> {
        const cycle = graph.findFirstCycle();
        if (cycle) {
            return new Set(cycle.edges.map(e => e.property));
        }
        return new Set();
    }

    private findDependentRequests(graph: Graph<SlotId, ReservationChangeRequest>): Set<ReservationChangeRequest> {
        const cycle = graph.findFirstCycle();
        if (cycle) {
            return new Set(cycle.edges.map(e => e.property));
        }
        return new Set();
    }
}
