import { Money, Percentage } from "@softwarearchetypes/quantity";
import { LogicalPredicate } from "../../../predicates/LogicalPredicate";
import { AndPredicate } from "../../../predicates/AndPredicate";
import { OrPredicate } from "../../../predicates/OrPredicate";
import { NotPredicate } from "../../../predicates/NotPredicate";

// Registry of constructors for deserializing beans from param maps.
// Since TypeScript lacks Java reflection, we register known classes manually.
export type BeanFactory = (reader: ReflectionBeanReader, prefix: string) => unknown;

const beanRegistry = new Map<string, BeanFactory>();

export function registerBeanFactory(className: string, factory: BeanFactory): void {
    beanRegistry.set(className, factory);
}

export class ReflectionBeanReader {
    private readonly props: Map<string, string>;

    constructor(props: Map<string, string>) {
        this.props = props;
    }

    readBean<T>(prefix: string): T {
        const classKey = prefix + ".class";
        const className = this.props.get(classKey);

        if (className === undefined || className.trim() === "") {
            throw new Error(`No entry '${classKey}'`);
        }

        // special Value Objects
        if (className === "Money") {
            return this.readMoney(prefix) as unknown as T;
        }

        if (className === "Percentage") {
            return this.readPercentage(prefix) as unknown as T;
        }

        // LogicalPredicate tree types
        const logicalResult = this.tryReadAsLogicalPredicate(prefix, className);
        if (logicalResult !== null) {
            return logicalResult as unknown as T;
        }

        // Registered bean factory
        const factory = beanRegistry.get(className);
        if (factory) {
            return factory(this, prefix) as T;
        }

        throw new Error(`Unknown class '${className}' for prefix '${prefix}'. Register it with registerBeanFactory().`);
    }

    private tryReadAsLogicalPredicate(prefix: string, className: string): LogicalPredicate<unknown> | null {
        if (className === "AndPredicate" || className === "OrPredicate" || className === "NotPredicate") {
            return this.readLogicalPredicate(prefix) as LogicalPredicate<unknown>;
        }
        return null;
    }

    readLogicalPredicate(basePrefix: string): LogicalPredicate<unknown> | null {
        const rootId = this.props.get(basePrefix + ".root");
        if (rootId === undefined || rootId.trim() === "") {
            return null;
        }
        return this.readLogicalNode(basePrefix, rootId);
    }

    private readLogicalNode(basePrefix: string, nodeId: string): LogicalPredicate<unknown> {
        const nodePrefix = basePrefix + "." + nodeId;
        const type = this.props.get(nodePrefix + ".type");
        if (type === undefined) {
            throw new Error(`No '${nodePrefix}.type' for node ${nodeId}`);
        }

        switch (type) {
            case "AND": {
                const leftId = this.props.get(nodePrefix + ".left");
                const rightId = this.props.get(nodePrefix + ".right");
                if (leftId === undefined || rightId === undefined) {
                    throw new Error(`No left/right for node AND: ${nodePrefix}`);
                }
                const left = this.readLogicalNode(basePrefix, leftId);
                const right = this.readLogicalNode(basePrefix, rightId);
                return new AndPredicate(left, right);
            }
            case "OR": {
                const leftId = this.props.get(nodePrefix + ".left");
                const rightId = this.props.get(nodePrefix + ".right");
                if (leftId === undefined || rightId === undefined) {
                    throw new Error(`No left/right for node OR: ${nodePrefix}`);
                }
                const left = this.readLogicalNode(basePrefix, leftId);
                const right = this.readLogicalNode(basePrefix, rightId);
                return new OrPredicate(left, right);
            }
            case "NOT": {
                const childId = this.props.get(nodePrefix + ".child");
                if (childId === undefined) {
                    throw new Error(`No child for node NOT: ${nodePrefix}`);
                }
                const child = this.readLogicalNode(basePrefix, childId);
                return new NotPredicate(child);
            }
            case "LEAF": {
                const className = this.props.get(nodePrefix + ".class");
                if (className === undefined) {
                    throw new Error(`No ${nodePrefix}.class for predicate leaf`);
                }
                const factory = beanRegistry.get(className);
                if (!factory) {
                    throw new Error(`Unknown leaf class '${className}'. Register it with registerBeanFactory().`);
                }
                const bean = factory(this, nodePrefix);
                return bean as LogicalPredicate<unknown>;
            }
            default:
                throw new Error(`Unknown type for logical node '${type}' for a prefix ${nodePrefix}`);
        }
    }

    readMoney(prefix: string): Money {
        const amountKey = prefix + ".money.amount";
        const currencyKey = prefix + ".money.currency";

        const amountStr = this.props.get(amountKey);
        const currCode = this.props.get(currencyKey);

        if (amountStr === undefined || currCode === undefined) {
            throw new Error(`No money data at: '${prefix}' (expected ${amountKey} and ${currencyKey})`);
        }

        const amount = parseFloat(amountStr);
        return Money.of(amount, currCode);
    }

    readPercentage(prefix: string): Percentage {
        const key = prefix + ".percentage.value";
        const valueStr = this.props.get(key);
        if (valueStr === undefined) {
            throw new Error(`No percentage value at: '${key}'`);
        }

        const val = parseFloat(valueStr);
        return Percentage.of(val);
    }

    readSimpleValue(key: string): string | undefined {
        return this.props.get(key);
    }
}
