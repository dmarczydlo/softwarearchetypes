import { PartyInOrder } from './party-in-order.js';
import { RoleInOrder } from './role-in-order.js';
import { RoleValidationPolicy, countByRole } from './role-validation-policy.js';

export class OrderLineLevelRolePolicy implements RoleValidationPolicy {

    validate(parties: PartyInOrder[]): void {
        const roleCounts = countByRole(parties);

        const ordererCount = roleCounts.get(RoleInOrder.ORDERER) ?? 0;
        if (ordererCount > 0) {
            throw new Error(
                "ORDERER role is only allowed at order level, found: " + ordererCount + " at line level"
            );
        }

        const executorCount = roleCounts.get(RoleInOrder.EXECUTOR) ?? 0;
        if (executorCount > 0) {
            throw new Error(
                "EXECUTOR role is only allowed at order level, found: " + executorCount + " at line level"
            );
        }

        const payerCount = roleCounts.get(RoleInOrder.PAYER) ?? 0;
        if (payerCount > 0) {
            throw new Error(
                "PAYER role is only allowed at order level, found: " + payerCount + " at line level"
            );
        }
    }
}
