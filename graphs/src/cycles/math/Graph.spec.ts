import { describe, it, expect } from 'vitest';
import { Graph } from './Graph.js';
import { Edge } from './Edge.js';
import { Node } from './Node.js';

describe('GraphIntersection', () => {
    it('intersection contains only common edges', () => {
        const graph1 = new Graph<string, string>();
        graph1.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph1.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));
        graph1.addEdge(new Edge(new Node('C'), new Node('A'), 'edge3'));

        const graph2 = new Graph<string, string>();
        graph2.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph2.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));

        const intersection = graph1.intersection(graph2);

        expect(intersection.hasEdge(new Node('A'), new Node('B'))).toBe(true);
        expect(intersection.hasEdge(new Node('B'), new Node('C'))).toBe(true);
        expect(intersection.hasEdge(new Node('C'), new Node('A'))).toBe(false);
    });

    it('intersection finds cycle only when all edges in both', () => {
        const graph1 = new Graph<string, string>();
        graph1.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph1.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));
        graph1.addEdge(new Edge(new Node('C'), new Node('A'), 'edge3'));

        const graph2 = new Graph<string, string>();
        graph2.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph2.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));
        graph2.addEdge(new Edge(new Node('C'), new Node('A'), 'edge3'));

        const intersection = graph1.intersection(graph2);
        const cycle = intersection.findFirstCycle();

        expect(cycle).not.toBeNull();
        expect(cycle!.edges.length).toBe(3);
    });

    it('intersection does not find cycle when edge missing in second graph', () => {
        const graph1 = new Graph<string, string>();
        graph1.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph1.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));
        graph1.addEdge(new Edge(new Node('C'), new Node('A'), 'edge3'));

        const graph2 = new Graph<string, string>();
        graph2.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph2.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));

        const intersection = graph1.intersection(graph2);
        const cycle = intersection.findFirstCycle();

        expect(cycle).toBeNull();
    });

    it('intersection of empty graphs is empty', () => {
        const graph1 = new Graph<string, string>();
        const graph2 = new Graph<string, string>();

        const intersection = graph1.intersection(graph2);
        const cycle = intersection.findFirstCycle();

        expect(cycle).toBeNull();
    });

    it('intersection with empty graph is empty', () => {
        const graph1 = new Graph<string, string>();
        graph1.addEdge(new Edge(new Node('A'), new Node('B'), 'edge1'));
        graph1.addEdge(new Edge(new Node('B'), new Node('C'), 'edge2'));

        const graph2 = new Graph<string, string>();

        const intersection = graph1.intersection(graph2);

        expect(intersection.hasEdge(new Node('A'), new Node('B'))).toBe(false);
        expect(intersection.hasEdge(new Node('B'), new Node('C'))).toBe(false);
    });
});
