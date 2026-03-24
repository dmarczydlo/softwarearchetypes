import { PartyInOrder } from './party-in-order.js';
import { PartySnapshot } from './party-snapshot.js';
import { RoleInOrder } from './role-in-order.js';
import { RoleValidationPolicy } from './role-validation-policy.js';
import { OrderLevelRolePolicy } from './order-level-role-policy.js';
import { OrderLineLevelRolePolicy } from './order-line-level-role-policy.js';

export class OrderParties {
    private readonly _parties: PartyInOrder[];
    private readonly validationPolicy: RoleValidationPolicy;

    private constructor(parties: PartyInOrder[], validationPolicy: RoleValidationPolicy) {
        this._parties = [...parties];
        this.validationPolicy = validationPolicy;
        this.validationPolicy.validate(this._parties);
    }

    static forOrder(parties: PartyInOrder[]): OrderParties {
        return new OrderParties(parties, new OrderLevelRolePolicy());
    }

    static forOrderLine(parties: PartyInOrder[]): OrderParties {
        return new OrderParties(parties, new OrderLineLevelRolePolicy());
    }

    static singleParty(customer: PartySnapshot, executor: PartySnapshot): OrderParties {
        return OrderParties.forOrder([
            PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER, RoleInOrder.RECEIVER),
            PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
        ]);
    }

    static corporate(company: PartySnapshot, executor: PartySnapshot, branch: PartySnapshot): OrderParties {
        return OrderParties.forOrder([
            PartyInOrder.of(company, RoleInOrder.ORDERER, RoleInOrder.PAYER),
            PartyInOrder.of(executor, RoleInOrder.EXECUTOR),
            PartyInOrder.of(branch, RoleInOrder.RECEIVER)
        ]);
    }

    parties(): PartyInOrder[] {
        return [...this._parties];
    }

    partiesWithRole(role: RoleInOrder): PartyInOrder[] {
        return this._parties.filter(p => p.hasRole(role));
    }

    partyWithRole(role: RoleInOrder): PartyInOrder {
        const found = this.partiesWithRole(role);
        if (found.length === 0) {
            throw new Error("No party found with role: " + role);
        }
        if (found.length > 1) {
            throw new Error(
                "Expected exactly one party with role " + role + ", found: " + found.length
            );
        }
        return found[0];
    }

    static merge(orderLevel: OrderParties, lineLevel: OrderParties): OrderParties {
        const lineLevelRoles = new Set<RoleInOrder>();
        for (const p of lineLevel._parties) {
            for (const role of p.roles) {
                lineLevelRoles.add(role);
            }
        }

        const orderLevelFiltered: PartyInOrder[] = [];
        for (const p of orderLevel._parties) {
            const remainingRoles = new Set<RoleInOrder>();
            for (const role of p.roles) {
                if (!lineLevelRoles.has(role)) {
                    remainingRoles.add(role);
                }
            }
            if (remainingRoles.size > 0) {
                orderLevelFiltered.push(PartyInOrder.ofSet(p.party, remainingRoles));
            }
        }

        const merged = [...orderLevelFiltered, ...lineLevel._parties];
        const noopPolicy: RoleValidationPolicy = { validate: () => {} };
        return new OrderParties(merged, noopPolicy);
    }

    isEmpty(): boolean {
        return this._parties.length === 0;
    }
}
