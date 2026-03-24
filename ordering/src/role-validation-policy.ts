import { PartyInOrder } from './party-in-order.js';
import { RoleInOrder } from './role-in-order.js';

export interface RoleValidationPolicy {
    validate(parties: PartyInOrder[]): void;
}

export function countByRole(parties: PartyInOrder[]): Map<RoleInOrder, number> {
    const counts = new Map<RoleInOrder, number>();
    for (const party of parties) {
        for (const role of party.roles) {
            counts.set(role, (counts.get(role) ?? 0) + 1);
        }
    }
    return counts;
}
