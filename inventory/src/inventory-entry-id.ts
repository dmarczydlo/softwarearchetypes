import { randomUUID } from 'crypto';

export class InventoryEntryId {
    readonly id: string;

    constructor(id: string) {
        if (id == null) {
            throw new Error('InventoryEntryId cannot be null');
        }
        this.id = id;
    }

    static random(): InventoryEntryId {
        return new InventoryEntryId(randomUUID());
    }

    static of(id: string): InventoryEntryId {
        return new InventoryEntryId(id);
    }

    equals(other: InventoryEntryId): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return this.id;
    }
}
