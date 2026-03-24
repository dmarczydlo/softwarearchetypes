export class TransactionType {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static readonly INITIALIZATION = new TransactionType("initialization");
    static readonly REVERSAL = new TransactionType("reversal");
    static readonly TRANSFER = new TransactionType("transfer");
    static readonly REALLOCATION = new TransactionType("reallocation");
    static readonly EXPIRATION_COMPENSATION = new TransactionType("expiration_compensation");

    static of(value: string): TransactionType {
        return new TransactionType(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: TransactionType): boolean {
        return this.value === other.value;
    }
}
