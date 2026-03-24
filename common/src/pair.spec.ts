import { describe, it, expect } from 'vitest';
import { Pair } from './pair.js';

describe('Pair', () => {

    it('should create pair with both values', () => {
        const first: string = "first";
        const second: string = "second";

        const pair: Pair<string> = new Pair(first, second);

        expect(pair).not.toBeNull();
        expect(pair.first).toBe(first);
        expect(pair.second).toBe(second);
    });

    it('should create pair with null values', () => {
        const first: string | null = null;
        const second: string | null = null;

        const pair: Pair<string | null> = new Pair(first, second);

        expect(pair).not.toBeNull();
        expect(pair.first).toBe(first);
        expect(pair.second).toBe(second);
    });

    it('should create pair with different types', () => {
        const first: number = 42;
        const second: number = 100;

        const pair: Pair<number> = new Pair(first, second);

        expect(pair.first).toBe(first);
        expect(pair.second).toBe(second);
    });

    it('should be equal when both pairs have same values', () => {
        const firstPair: Pair<string> = new Pair("A", "B");
        const secondPair: Pair<string> = new Pair("A", "B");

        expect(firstPair.equals(secondPair)).toBe(true);
        expect(firstPair.hashCode()).toBe(secondPair.hashCode());
    });

    it('should not be equal when pairs have different first value', () => {
        const firstPair: Pair<string> = new Pair("A", "B");
        const secondPair: Pair<string> = new Pair("C", "B");

        expect(firstPair.equals(secondPair)).toBe(false);
    });

    it('should not be equal when pairs have different second value', () => {
        const firstPair: Pair<string> = new Pair("A", "B");
        const secondPair: Pair<string> = new Pair("A", "C");

        expect(firstPair.equals(secondPair)).toBe(false);
    });

    it('should not be equal when pairs have different values', () => {
        const firstPair: Pair<string> = new Pair("A", "B");
        const secondPair: Pair<string> = new Pair("C", "D");

        expect(firstPair.equals(secondPair)).toBe(false);
    });

    it('should have proper toString representation', () => {
        const pair: Pair<string> = new Pair("first", "second");

        const result: string = pair.toString();

        expect(result).not.toBeNull();
        expect(result).toBe("Pair[first=first, second=second]");
    });

    it('should create pair with same value for both elements', () => {
        const value: string = "same";

        const pair: Pair<string> = new Pair(value, value);

        expect(pair.first).toBe(value);
        expect(pair.second).toBe(value);
        expect(pair.first).toBe(pair.second);
    });

    it('should create pair using static of method', () => {
        const pair: Pair<string> = Pair.of("a", "b");

        expect(pair.first).toBe("a");
        expect(pair.second).toBe("b");
    });
});
