import { describe, it, expect } from 'vitest';
import { Eligibility } from './Eligibility.js';
import { OwnerId } from './OwnerId.js';

describe('Eligibility', () => {
    it('can mark transfer as eligible', () => {
        const eligibility = new Eligibility();
        const alice = OwnerId.of('Alice');
        const bob = OwnerId.of('Bob');

        eligibility.markTransferEligible(alice, bob);

        expect(eligibility.isTransferEligible(alice, bob)).toBe(true);
    });

    it('transfer is ineligible by default', () => {
        const eligibility = new Eligibility();
        const alice = OwnerId.of('Alice');
        const bob = OwnerId.of('Bob');

        expect(eligibility.isTransferEligible(alice, bob)).toBe(false);
    });

    it('can mark transfer as ineligible', () => {
        const eligibility = new Eligibility();
        const alice = OwnerId.of('Alice');
        const bob = OwnerId.of('Bob');
        eligibility.markTransferEligible(alice, bob);

        eligibility.markTransferIneligible(alice, bob);

        expect(eligibility.isTransferEligible(alice, bob)).toBe(false);
    });

    it('transfer is asymmetric - Alice->Bob does not mean Bob->Alice', () => {
        const eligibility = new Eligibility();
        const alice = OwnerId.of('Alice');
        const bob = OwnerId.of('Bob');

        eligibility.markTransferEligible(alice, bob);

        expect(eligibility.isTransferEligible(alice, bob)).toBe(true);
        expect(eligibility.isTransferEligible(bob, alice)).toBe(false);
    });

    it('multiple transfers can be eligible', () => {
        const eligibility = new Eligibility();
        const alice = OwnerId.of('Alice');
        const bob = OwnerId.of('Bob');
        const charlie = OwnerId.of('Charlie');

        eligibility.markTransferEligible(alice, bob);
        eligibility.markTransferEligible(bob, charlie);
        eligibility.markTransferEligible(charlie, alice);

        expect(eligibility.isTransferEligible(alice, bob)).toBe(true);
        expect(eligibility.isTransferEligible(bob, charlie)).toBe(true);
        expect(eligibility.isTransferEligible(charlie, alice)).toBe(true);
    });
});
