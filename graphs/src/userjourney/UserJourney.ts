import { UserJourneyId } from './UserJourneyId.js';
import { State } from './State.js';
import { Condition } from './Condition.js';
import { CustomerPath } from './CustomerPath.js';
import { ProductType } from './Product.js';

interface JourneyEdge {
    from: State;
    to: State;
    condition: Condition;
}

/**
 * Internal directed graph for user journey state machine.
 */
class JourneyGraph {
    private readonly vertices = new Map<string, State>();
    private readonly edges: JourneyEdge[] = [];

    addVertex(state: State): void {
        this.vertices.set(state.key(), state);
    }

    addEdge(from: State, to: State, condition: Condition): void {
        this.addVertex(from);
        this.addVertex(to);
        this.edges.push({ from, to, condition });
    }

    vertexSet(): State[] {
        return [...this.vertices.values()];
    }

    outgoingEdgesOf(state: State): JourneyEdge[] {
        const key = state.key();
        return this.edges.filter(e => e.from.key() === key);
    }

    /**
     * Find all simple paths from source to target using DFS.
     */
    getAllPaths(source: State, target: State): Condition[][] {
        const results: Condition[][] = [];
        const sourceKey = source.key();
        const targetKey = target.key();

        const dfs = (currentKey: string, path: Condition[], visited: Set<string>) => {
            if (currentKey === targetKey) {
                results.push([...path]);
                return;
            }

            for (const edge of this.edges) {
                if (edge.from.key() === currentKey && !visited.has(edge.to.key())) {
                    visited.add(edge.to.key());
                    path.push(edge.condition);
                    dfs(edge.to.key(), path, visited);
                    path.pop();
                    visited.delete(edge.to.key());
                }
            }
        };

        const visited = new Set<string>([sourceKey]);
        dfs(sourceKey, [], visited);
        return results;
    }
}

export class UserJourney {
    readonly userJourneyId: UserJourneyId;
    private readonly graph: JourneyGraph;
    private readonly _currentState: State;

    constructor(userJourneyId: UserJourneyId, graph: JourneyGraph, currentState: State) {
        this.userJourneyId = userJourneyId;
        this.graph = graph;
        this._currentState = currentState;
    }

    currentState(): State {
        return this._currentState;
    }

    static builder(userJourneyId: UserJourneyId): UserJourneyBuilder {
        return new UserJourneyBuilder(userJourneyId);
    }

    waysToAchieve(productType: ProductType): Set<CustomerPath> {
        const statesWithProduct = this.graph.vertexSet()
            .filter(state => state.contains(productType));

        const paths = new Set<CustomerPath>();
        for (const targetState of statesWithProduct) {
            const allPaths = this.graph.getAllPaths(this._currentState, targetState);
            for (const conditionPath of allPaths) {
                paths.add(CustomerPath.of(conditionPath));
            }
        }
        return paths;
    }

    onFulfilled(condition: Condition): UserJourney {
        const outgoing = this.graph.outgoingEdgesOf(this._currentState);
        for (const edge of outgoing) {
            if (edge.condition.equals(condition)) {
                return new UserJourney(this.userJourneyId, this.graph, edge.to);
            }
        }
        return this;
    }

    optimizedWayToAchieve(productType: ProductType, weightFunction: (c: Condition) => number): CustomerPath | null {
        const ways = this.waysToAchieve(productType);
        let best: CustomerPath | null = null;
        let bestWeight = Infinity;
        for (const path of ways) {
            const w = path.weight(weightFunction);
            if (w < bestWeight) {
                bestWeight = w;
                best = path;
            }
        }
        return best;
    }
}

export class UserJourneyBuilder {
    readonly userJourneyId: UserJourneyId;
    readonly graph: JourneyGraph = new JourneyGraph();
    private _currentState: State | null = null;

    constructor(userJourneyId: UserJourneyId) {
        this.userJourneyId = userJourneyId;
    }

    from(state: State): TransitionBuilder {
        this.graph.addVertex(state);
        return new TransitionBuilder(this, state);
    }

    withCurrentState(currentState: State): UserJourneyBuilder {
        this._currentState = currentState;
        return this;
    }

    build(): UserJourney {
        return new UserJourney(this.userJourneyId, this.graph, this._currentState!);
    }
}

class TransitionBuilder {
    private readonly builder: UserJourneyBuilder;
    private readonly fromState: State;

    constructor(builder: UserJourneyBuilder, fromState: State) {
        this.builder = builder;
        this.fromState = fromState;
    }

    on(condition: Condition): TransitionWithCondition {
        return new TransitionWithCondition(this.builder, this.fromState, condition);
    }
}

class TransitionWithCondition {
    private readonly builder: UserJourneyBuilder;
    private readonly fromState: State;
    private readonly condition: Condition;

    constructor(builder: UserJourneyBuilder, fromState: State, condition: Condition) {
        this.builder = builder;
        this.fromState = fromState;
        this.condition = condition;
    }

    goto_(toState: State): UserJourneyBuilder {
        this.builder.graph.addEdge(this.fromState, toState, this.condition);
        return this.builder;
    }
}
