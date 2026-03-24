import { describe, it, expect } from 'vitest';
import { OrderParties } from './order-parties.js';
import { PartyInOrder } from './party-in-order.js';
import { PartySnapshot } from './party-snapshot.js';
import { PartyId } from './party-id.js';
import { RoleInOrder } from './role-in-order.js';

describe('OrderParties', () => {
    const customer = PartySnapshot.of(PartyId.of("customer-1"), "Customer", "c@test.com");
    const executor = PartySnapshot.of(PartyId.of("executor-1"), "Executor", "e@test.com");
    const branch = PartySnapshot.of(PartyId.of("branch-1"), "Branch", "b@test.com");
    const courier = PartySnapshot.of(PartyId.of("courier-1"), "Courier", "k@test.com");

    it('singleParty should assign all customer roles and executor', () => {
        const parties = OrderParties.singleParty(customer, executor);

        expect(parties.partyWithRole(RoleInOrder.ORDERER).partyId().value).toBe(customer.partyId.value);
        expect(parties.partyWithRole(RoleInOrder.PAYER).partyId().value).toBe(customer.partyId.value);
        expect(parties.partyWithRole(RoleInOrder.RECEIVER).partyId().value).toBe(customer.partyId.value);
        expect(parties.partyWithRole(RoleInOrder.EXECUTOR).partyId().value).toBe(executor.partyId.value);
    });

    it('corporate should split roles across parties', () => {
        const parties = OrderParties.corporate(customer, executor, branch);

        expect(parties.partyWithRole(RoleInOrder.ORDERER).partyId().value).toBe(customer.partyId.value);
        expect(parties.partyWithRole(RoleInOrder.PAYER).partyId().value).toBe(customer.partyId.value);
        expect(parties.partyWithRole(RoleInOrder.EXECUTOR).partyId().value).toBe(executor.partyId.value);
        expect(parties.partyWithRole(RoleInOrder.RECEIVER).partyId().value).toBe(branch.partyId.value);
    });

    it('partiesWithRole should return all matching parties', () => {
        const parties = OrderParties.singleParty(customer, executor);

        const receivers = parties.partiesWithRole(RoleInOrder.RECEIVER);

        expect(receivers).toHaveLength(1);
        expect(receivers[0].partyId().value).toBe(customer.partyId.value);
    });

    it('partyWithRole should throw when none found', () => {
        const parties = OrderParties.forOrder([
            PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER),
            PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
        ]);

        expect(() => parties.partyWithRole(RoleInOrder.RECEIVER)).toThrow();
    });

    it('merge should override order level roles with line level roles', () => {
        const orderLevel = OrderParties.singleParty(customer, executor);
        const lineLevel = OrderParties.forOrderLine([
            PartyInOrder.of(branch, RoleInOrder.RECEIVER)
        ]);

        const merged = OrderParties.merge(orderLevel, lineLevel);

        expect(merged.partyWithRole(RoleInOrder.RECEIVER).partyId().value).toBe(branch.partyId.value);
        expect(merged.partyWithRole(RoleInOrder.ORDERER).partyId().value).toBe(customer.partyId.value);
        expect(merged.partyWithRole(RoleInOrder.PAYER).partyId().value).toBe(customer.partyId.value);
        expect(merged.partyWithRole(RoleInOrder.EXECUTOR).partyId().value).toBe(executor.partyId.value);
    });

    it('merge should preserve order level roles not overridden', () => {
        const orderLevel = OrderParties.singleParty(customer, executor);
        const lineLevel = OrderParties.forOrderLine([
            PartyInOrder.of(courier, RoleInOrder.DELIVERY_CONTACT)
        ]);

        const merged = OrderParties.merge(orderLevel, lineLevel);

        expect(merged.partyWithRole(RoleInOrder.ORDERER).partyId().value).toBe(customer.partyId.value);
        expect(merged.partyWithRole(RoleInOrder.RECEIVER).partyId().value).toBe(customer.partyId.value);
        expect(merged.partyWithRole(RoleInOrder.DELIVERY_CONTACT).partyId().value).toBe(courier.partyId.value);
    });

    it('merge with empty line level should preserve all order level parties', () => {
        const orderLevel = OrderParties.singleParty(customer, executor);
        const lineLevel = OrderParties.forOrderLine([]);

        const merged = OrderParties.merge(orderLevel, lineLevel);

        expect(merged.partyWithRole(RoleInOrder.ORDERER).partyId().value).toBe(customer.partyId.value);
        expect(merged.partyWithRole(RoleInOrder.EXECUTOR).partyId().value).toBe(executor.partyId.value);
    });

    it('forOrderLine with empty list should be empty', () => {
        const parties = OrderParties.forOrderLine([]);

        expect(parties.isEmpty()).toBe(true);
    });

    it('isEmpty should return false when parties exist', () => {
        const parties = OrderParties.singleParty(customer, executor);

        expect(parties.isEmpty()).toBe(false);
    });
});
