import { Money, Percentage } from "@softwarearchetypes/quantity";
import { LogicalPredicate } from "../../../predicates/LogicalPredicate";
import { AndPredicate } from "../../../predicates/AndPredicate";
import { OrPredicate } from "../../../predicates/OrPredicate";
import { NotPredicate } from "../../../predicates/NotPredicate";
import { BinaryLogicalPredicate } from "../../../predicates/BinaryLogicalPredicate";

// Registry of serializers for writing beans to param maps.
export type BeanSerializer = (writer: ReflectionBeanWriter, prefix: string, bean: unknown, out: Map<string, string>) => void;

const serializerRegistry = new Map<string, BeanSerializer>();

export function registerBeanSerializer(className: string, serializer: BeanSerializer): void {
    serializerRegistry.set(className, serializer);
}

class NodeIdGenerator {
    private counter = 1;
    nextId(): string {
        return "n" + this.counter++;
    }
}

export class ReflectionBeanWriter {

    writeBean(prefix: string, bean: unknown, out: Map<string, string>): void {
        if (bean === null || bean === undefined) {
            return;
        }

        // special Value Objects
        if (bean instanceof Money) {
            this.writeMoney(prefix, bean, out);
            return;
        }

        if (bean instanceof Percentage) {
            this.writePercentage(prefix, bean, out);
            return;
        }

        // Check if it's a LogicalPredicate (duck-typing for logical tree types)
        if (this.isLogicalPredicate(bean)) {
            this.writeLogicalPredicate(prefix, bean as LogicalPredicate<unknown>, out);
            return;
        }

        // Registered serializer
        const className = this.getClassName(bean);
        out.set(prefix + ".class", className);

        const serializer = serializerRegistry.get(className);
        if (serializer) {
            serializer(this, prefix, bean, out);
            return;
        }

        throw new Error(`No serializer registered for class '${className}'. Register it with registerBeanSerializer().`);
    }

    writeLogicalPredicate(basePrefix: string, root: LogicalPredicate<unknown>, out: Map<string, string>): void {
        if (root === null || root === undefined) {
            return;
        }
        const gen = new NodeIdGenerator();
        const rootId = gen.nextId();
        out.set(basePrefix + ".root", rootId);
        this.writeLogicalNode(basePrefix, rootId, root, out, gen);
    }

    private writeLogicalNode(
        basePrefix: string,
        nodeId: string,
        predicate: LogicalPredicate<unknown>,
        out: Map<string, string>,
        gen: NodeIdGenerator
    ): void {
        const nodePrefix = basePrefix + "." + nodeId;

        if (predicate instanceof AndPredicate) {
            out.set(nodePrefix + ".type", "AND");
            const leftId = gen.nextId();
            const rightId = gen.nextId();
            out.set(nodePrefix + ".left", leftId);
            out.set(nodePrefix + ".right", rightId);
            this.writeLogicalNode(basePrefix, leftId, predicate.left() as LogicalPredicate<unknown>, out, gen);
            this.writeLogicalNode(basePrefix, rightId, predicate.right() as LogicalPredicate<unknown>, out, gen);
        } else if (predicate instanceof OrPredicate) {
            out.set(nodePrefix + ".type", "OR");
            const leftId = gen.nextId();
            const rightId = gen.nextId();
            out.set(nodePrefix + ".left", leftId);
            out.set(nodePrefix + ".right", rightId);
            this.writeLogicalNode(basePrefix, leftId, predicate.left() as LogicalPredicate<unknown>, out, gen);
            this.writeLogicalNode(basePrefix, rightId, predicate.right() as LogicalPredicate<unknown>, out, gen);
        } else if (predicate instanceof NotPredicate) {
            out.set(nodePrefix + ".type", "NOT");
            const childId = gen.nextId();
            out.set(nodePrefix + ".child", childId);
            this.writeLogicalNode(basePrefix, childId, predicate.child() as LogicalPredicate<unknown>, out, gen);
        } else {
            // LEAF
            out.set(nodePrefix + ".type", "LEAF");
            const className = this.getClassName(predicate);
            out.set(nodePrefix + ".class", className);

            const serializer = serializerRegistry.get(className);
            if (serializer) {
                serializer(this, nodePrefix, predicate, out);
            } else {
                throw new Error(`No serializer registered for leaf class '${className}'`);
            }
        }
    }

    private writeMoney(prefix: string, money: Money, out: Map<string, string>): void {
        out.set(prefix + ".class", "Money");
        out.set(prefix + ".money.amount", money.value().toString());
        out.set(prefix + ".money.currency", money.currency());
    }

    private writePercentage(prefix: string, percentage: Percentage, out: Map<string, string>): void {
        out.set(prefix + ".class", "Percentage");
        out.set(prefix + ".percentage.value", percentage.value.toString());
    }

    private isLogicalPredicate(bean: unknown): boolean {
        return bean instanceof AndPredicate
            || bean instanceof OrPredicate
            || bean instanceof NotPredicate
            || bean instanceof BinaryLogicalPredicate;
    }

    private getClassName(bean: unknown): string {
        return (bean as { constructor: { name: string } }).constructor.name;
    }

    writeSimpleValue(prefix: string, key: string, value: string | number | boolean, out: Map<string, string>): void {
        out.set(prefix + "." + key, String(value));
    }
}
