import { describe, it, expect } from 'vitest';
import { Validity } from './validity.js';

const EPOCH = new Date(0);
const MAX_DATE = new Date(8640000000000000);

const PAST = new Date(2024, 0, 10, 12, 0);
const NOW = new Date(2024, 0, 15, 12, 0);
const FUTURE = new Date(2024, 0, 20, 12, 0);
const FOREVER = new Date(MAX_DATE.getTime() - 1);

describe('Validity', () => {
    it('can create validity until specific date', () => {
        const validity = Validity.until(NOW);
        expect(validity.validFrom.getTime()).toBe(EPOCH.getTime());
        expect(validity.validTo.getTime()).toBe(NOW.getTime());
    });

    it('can create validity from specific date', () => {
        const validity = Validity.from(NOW);
        expect(validity.validFrom.getTime()).toBe(NOW.getTime());
        expect(validity.validTo.getTime()).toBe(MAX_DATE.getTime());
    });

    it('can create validity between dates', () => {
        const validity = Validity.between(PAST, FUTURE);
        expect(validity.validFrom.getTime()).toBe(PAST.getTime());
        expect(validity.validTo.getTime()).toBe(FUTURE.getTime());
    });

    it('can create always valid validity', () => {
        const validity = Validity.always();
        expect(validity.validFrom.getTime()).toBe(EPOCH.getTime());
        expect(validity.validTo.getTime()).toBe(MAX_DATE.getTime());
    });

    it('is valid at instant within range', () => {
        const validity = Validity.between(PAST, FUTURE);
        expect(validity.isValidAt(NOW)).toBe(true);
        expect(validity.isValidAt(PAST)).toBe(true);
        expect(validity.isValidAt(FUTURE)).toBe(false); // exclusive
    });

    it('is not valid at instant before valid from', () => {
        const validity = Validity.between(NOW, FUTURE);
        expect(validity.isValidAt(PAST)).toBe(false);
    });

    it('is not valid at instant after valid to', () => {
        const validity = Validity.between(PAST, NOW);
        expect(validity.isValidAt(FUTURE)).toBe(false);
    });

    it('is always valid when created as always', () => {
        const validity = Validity.always();
        expect(validity.isValidAt(EPOCH)).toBe(true);
        expect(validity.isValidAt(PAST)).toBe(true);
        expect(validity.isValidAt(NOW)).toBe(true);
        expect(validity.isValidAt(FUTURE)).toBe(true);
        expect(validity.isValidAt(FOREVER)).toBe(true);
    });

    it('is valid from specified date onwards', () => {
        const validity = Validity.from(NOW);
        expect(validity.isValidAt(PAST)).toBe(false);
        expect(validity.isValidAt(NOW)).toBe(true);
        expect(validity.isValidAt(FUTURE)).toBe(true);
        expect(validity.isValidAt(FOREVER)).toBe(true);
    });

    it('is valid until specified date', () => {
        const validity = Validity.until(NOW);
        expect(validity.isValidAt(PAST)).toBe(true);
        expect(validity.isValidAt(NOW)).toBe(false); // exclusive
        expect(validity.isValidAt(FUTURE)).toBe(false);
        expect(validity.isValidAt(EPOCH)).toBe(true);
    });

    it('has not expired when always valid', () => {
        const validity = Validity.always();
        expect(validity.hasExpired(NOW)).toBe(false);
        expect(validity.hasExpired(FUTURE)).toBe(false);
        expect(validity.hasExpired(FOREVER)).toBe(false);
    });

    it('has not expired when instant is before valid to', () => {
        const validity = Validity.until(FUTURE);
        expect(validity.hasExpired(PAST)).toBe(false);
        expect(validity.hasExpired(NOW)).toBe(false);
        expect(validity.hasExpired(FUTURE)).toBe(true); // exclusive
    });

    it('has expired when instant is after valid to', () => {
        const validity = Validity.until(NOW);
        expect(validity.hasExpired(FUTURE)).toBe(true);
        expect(validity.hasExpired(NOW)).toBe(true); // exclusive
        expect(validity.hasExpired(PAST)).toBe(false);
    });

    it('handles instant equal to valid from and valid to', () => {
        const validity = Validity.between(NOW, NOW);
        expect(validity.isValidAt(NOW)).toBe(false); // empty range [NOW, NOW)
        expect(validity.isValidAt(PAST)).toBe(false);
        expect(validity.isValidAt(FUTURE)).toBe(false);
    });

    it('handles edge case with min instant', () => {
        const validity = Validity.from(EPOCH);
        expect(validity.isValidAt(EPOCH)).toBe(true);
        expect(validity.isValidAt(NOW)).toBe(true);
        expect(validity.isValidAt(FOREVER)).toBe(true);
    });

    it('handles edge case with max instant', () => {
        const validity = Validity.until(MAX_DATE);
        expect(validity.isValidAt(EPOCH)).toBe(true);
        expect(validity.isValidAt(NOW)).toBe(true);
        expect(validity.isValidAt(MAX_DATE)).toBe(false); // exclusive
    });

    it('never expires when valid from specified', () => {
        const validity = Validity.from(PAST);
        expect(validity.hasExpired(NOW)).toBe(false);
        expect(validity.hasExpired(FUTURE)).toBe(false);
        expect(validity.hasExpired(FOREVER)).toBe(false);
    });

    it('expires exactly at valid to', () => {
        const validity = Validity.until(NOW);
        expect(validity.hasExpired(PAST)).toBe(false);
        expect(validity.hasExpired(NOW)).toBe(true); // exclusive
        expect(validity.hasExpired(FUTURE)).toBe(true);
    });

    it('is valid exactly one millisecond before valid to', () => {
        const oneMillisecondBefore = new Date(NOW.getTime() - 1);
        const validity = Validity.between(PAST, NOW);
        expect(validity.isValidAt(oneMillisecondBefore)).toBe(true);
        expect(validity.isValidAt(NOW)).toBe(false); // exclusive
        expect(validity.isValidAt(new Date(NOW.getTime() + 1))).toBe(false);
    });
});
