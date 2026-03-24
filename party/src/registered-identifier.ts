import { Validity } from './validity.js';

export interface RegisteredIdentifier {
    type(): string;
    asString(): string;
    validity(): Validity;
    isCurrentlyValid(): boolean;
    isValidAt(instant: Date): boolean;
}

export function createRegisteredIdentifierDefaults(self: RegisteredIdentifier): { isCurrentlyValid: () => boolean; isValidAt: (instant: Date) => boolean } {
    return {
        isCurrentlyValid(): boolean {
            return self.validity().isCurrentlyValid();
        },
        isValidAt(instant: Date): boolean {
            return self.validity().isValidAt(instant);
        }
    };
}
