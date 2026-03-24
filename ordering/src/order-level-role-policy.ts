import { PartyInOrder } from './party-in-order.js';
import { RoleInOrder } from './role-in-order.js';
import { RoleValidationPolicy, countByRole } from './role-validation-policy.js';

export class OrderLevelRolePolicy implements RoleValidationPolicy {

    validate(parties: PartyInOrder[]): void {
        const roleCounts = countByRole(parties);

        const ordererCount = roleCounts.get(RoleInOrder.ORDERER) ?? 0;
        if (ordererCount !== 1) {
            throw new Error(
                "ORDERER role must appear exactly once, found: " + ordererCount
            );
        }

        const executorCount = roleCounts.get(RoleInOrder.EXECUTOR) ?? 0;
        if (executorCount !== 1) {
            throw new Error(
                "EXECUTOR role must appear exactly once, found: " + executorCount
            );
        }

        const payerCount = roleCounts.get(RoleInOrder.PAYER) ?? 0;
        if (payerCount > 1) {
            throw new Error(
                "PAYER role can appear at most once, found: " + payerCount
            );
        }

        const deliveryContactCount = roleCounts.get(RoleInOrder.DELIVERY_CONTACT) ?? 0;
        if (deliveryContactCount > 0) {
            throw new Error(
                "DELIVERY_CONTACT role is only allowed at order line level, found: " + deliveryContactCount
            );
        }

        const pickupAuthorizedCount = roleCounts.get(RoleInOrder.PICKUP_AUTHORIZED) ?? 0;
        if (pickupAuthorizedCount > 0) {
            throw new Error(
                "PICKUP_AUTHORIZED role is only allowed at order line level, found: " + pickupAuthorizedCount
            );
        }
    }
}
