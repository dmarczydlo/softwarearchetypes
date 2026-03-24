import { describe, it, expect } from 'vitest';
import { Version } from './version.js';

describe('Version', () => {

    it('should create initial version with zero value', () => {
        const version: Version = Version.initial();

        expect(version).not.toBeNull();
        expect(version.value).toBe(0);
    });

    it('should create version with specific value', () => {
        const value: number = 42;

        const version: Version = Version.of(value);

        expect(version).not.toBeNull();
        expect(version.value).toBe(value);
    });

    it('should create version with zero value', () => {
        const version: Version = Version.of(0);

        expect(version.value).toBe(0);
    });

    it('should create version with negative value', () => {
        const value: number = -1;

        const version: Version = Version.of(value);

        expect(version.value).toBe(value);
    });

    it('should create version with max safe integer value', () => {
        const value: number = Number.MAX_SAFE_INTEGER;

        const version: Version = Version.of(value);

        expect(version.value).toBe(value);
    });

    it('should create version with min safe integer value', () => {
        const value: number = Number.MIN_SAFE_INTEGER;

        const version: Version = Version.of(value);

        expect(version.value).toBe(value);
    });

    it('should be equal when versions have same value', () => {
        const firstVersion: Version = Version.of(10);
        const secondVersion: Version = Version.of(10);

        expect(firstVersion.equals(secondVersion)).toBe(true);
        expect(firstVersion.hashCode()).toBe(secondVersion.hashCode());
    });

    it('should not be equal when versions have different values', () => {
        const firstVersion: Version = Version.of(10);
        const secondVersion: Version = Version.of(20);

        expect(firstVersion.equals(secondVersion)).toBe(false);
    });

    it('should have proper toString representation', () => {
        const version: Version = Version.of(123);

        const result: string = version.toString();

        expect(result).not.toBeNull();
        expect(result).toBe("Version[value=123]");
    });

    it('should initial version be equal to version of zero', () => {
        const initialVersion: Version = Version.initial();
        const zeroVersion: Version = Version.of(0);

        expect(initialVersion.equals(zeroVersion)).toBe(true);
    });

    it('should create multiple initial versions with same value', () => {
        const firstInitial: Version = Version.initial();
        const secondInitial: Version = Version.initial();

        expect(firstInitial.equals(secondInitial)).toBe(true);
        expect(firstInitial.value).toBe(0);
        expect(secondInitial.value).toBe(0);
    });
});
