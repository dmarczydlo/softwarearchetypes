import { Edge } from './math/Edge.js';
import { Graph } from './math/Graph.js';
import { Node } from './math/Node.js';
import { OwnerId } from './OwnerId.js';

export class Eligibility {
    private readonly graph: Graph<OwnerId, void> = new Graph<OwnerId, void>();

    markTransferEligible(from: OwnerId, to: OwnerId): void {
        this.graph.addEdge(new Edge<OwnerId, void>(new Node(from), new Node(to)));
    }

    markTransferIneligible(from: OwnerId, to: OwnerId): void {
        this.graph.removeEdge(new Edge<OwnerId, void>(new Node(from), new Node(to)));
    }

    isTransferEligible(from: OwnerId, to: OwnerId): boolean {
        return this.graph.hasEdge(new Node(from), new Node(to));
    }

    asGraph(): Graph<OwnerId, void> {
        return this.graph;
    }
}
