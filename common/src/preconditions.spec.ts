import { describe, it, expect } from 'vitest';
import { Preconditions } from './preconditions.js';

describe('Preconditions', () => {

    it('should not throw exception when checkArgument with true expression', () => {
        const expression: boolean = true;
        const errorMessage: string = "This should not be thrown";

        expect(() => Preconditions.checkArgument(expression, errorMessage)).not.toThrow();
    });

    it('should throw error when checkArgument with false expression', () => {
        const expression: boolean = false;
        const errorMessage: string = "Expression must be true";

        expect(() => Preconditions.checkArgument(expression, errorMessage)).toThrow(errorMessage);
    });

    it('should not throw exception when checkNotNull with non-null value', () => {
        const value: string = "non-null value";
        const errorMessage: string = "This should not be thrown";

        expect(() => Preconditions.checkNotNull(value, errorMessage)).not.toThrow();
    });

    it('should throw error when checkNotNull with null value', () => {
        const value: unknown = null;
        const errorMessage: string = "Value cannot be null";

        expect(() => Preconditions.checkNotNull(value, errorMessage)).toThrow(errorMessage);
    });

    it('should throw error for complex condition that fails', () => {
        const age: number = 15;
        const errorMessage: string = "Age must be at least 18";

        expect(() => Preconditions.checkArgument(age >= 18, errorMessage)).toThrow(errorMessage);
    });

    it('should not throw exception for complex condition that passes', () => {
        const age: number = 25;
        const errorMessage: string = "Age must be at least 18";

        expect(() => Preconditions.checkArgument(age >= 18, errorMessage)).not.toThrow();
    });

    it('should not throw exception when checkState with true state', () => {
        expect(() => Preconditions.checkState(true, "Should not throw")).not.toThrow();
    });

    it('should throw error when checkState with false state', () => {
        const errorMessage: string = "Invalid state";
        expect(() => Preconditions.checkState(false, errorMessage)).toThrow(errorMessage);
    });
});
