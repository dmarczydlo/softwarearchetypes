import { describe, it, expect } from 'vitest';
import { OrderParties } from './order-parties.js';
import { PartyInOrder } from './party-in-order.js';
import { PartySnapshot } from './party-snapshot.js';
import { PartyId } from './party-id.js';
import { RoleInOrder } from './role-in-order.js';

describe('RoleValidationPolicy', () => {
    const customer = PartySnapshot.of(PartyId.of("customer-1"), "Customer", "c@test.com");
    const executor = PartySnapshot.of(PartyId.of("executor-1"), "Executor", "e@test.com");
    const branch = PartySnapshot.of(PartyId.of("branch-1"), "Branch", "b@test.com");

    describe('OrderLevel', () => {
        it('should accept valid order with all required roles', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER, RoleInOrder.RECEIVER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
            ])).not.toThrow();
        });

        it('should accept order without payer', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.RECEIVER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
            ])).not.toThrow();
        });

        it('should accept order without receiver', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
            ])).not.toThrow();
        });

        it('should fail when orderer missing', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.PAYER, RoleInOrder.RECEIVER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
            ])).toThrow();
        });

        it('should fail when executor missing', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER, RoleInOrder.RECEIVER)
            ])).toThrow();
        });

        it('should fail when multiple payers', () => {
            const payer2 = PartySnapshot.of(PartyId.of("payer-2"), "Payer Two", "p2@test.com");

            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR),
                PartyInOrder.of(payer2, RoleInOrder.PAYER)
            ])).toThrow();
        });

        it('should fail when delivery contact at order level', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR),
                PartyInOrder.of(branch, RoleInOrder.DELIVERY_CONTACT)
            ])).toThrow();
        });

        it('should fail when pickup authorized at order level', () => {
            expect(() => OrderParties.forOrder([
                PartyInOrder.of(customer, RoleInOrder.ORDERER, RoleInOrder.PAYER),
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR),
                PartyInOrder.of(branch, RoleInOrder.PICKUP_AUTHORIZED)
            ])).toThrow();
        });
    });

    describe('LineLevel', () => {
        it('should accept receiver at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(branch, RoleInOrder.RECEIVER)
            ])).not.toThrow();
        });

        it('should accept delivery contact at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(branch, RoleInOrder.DELIVERY_CONTACT)
            ])).not.toThrow();
        });

        it('should accept pickup authorized at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(branch, RoleInOrder.PICKUP_AUTHORIZED)
            ])).not.toThrow();
        });

        it('should accept empty line level', () => {
            expect(() => OrderParties.forOrderLine([])).not.toThrow();
        });

        it('should fail when orderer at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(customer, RoleInOrder.ORDERER)
            ])).toThrow();
        });

        it('should fail when executor at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(executor, RoleInOrder.EXECUTOR)
            ])).toThrow();
        });

        it('should fail when payer at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(customer, RoleInOrder.PAYER)
            ])).toThrow();
        });

        it('should accept multiple roles at line level', () => {
            expect(() => OrderParties.forOrderLine([
                PartyInOrder.of(branch, RoleInOrder.RECEIVER, RoleInOrder.DELIVERY_CONTACT, RoleInOrder.PICKUP_AUTHORIZED)
            ])).not.toThrow();
        });
    });
});
