import { InventoryEntry } from './inventory-entry';
import { InventoryEntryId } from './inventory-entry-id';
import { InventoryEntryRepository } from './inventory-entry-repository';
import { ProductIdentifier } from './product-identifier';

export class InMemoryInventoryEntryRepository implements InventoryEntryRepository {
    private readonly storage = new Map<string, InventoryEntry>();

    save(entry: InventoryEntry): void {
        this.storage.set(entry.id.id, entry);
    }

    findById(id: InventoryEntryId): InventoryEntry | null {
        return this.storage.get(id.id) ?? null;
    }

    findByProductId(productId: ProductIdentifier): InventoryEntry | null {
        for (const entry of this.storage.values()) {
            if (entry.productId().equals(productId)) {
                return entry;
            }
        }
        return null;
    }

    findAll(): InventoryEntry[] {
        return [...this.storage.values()];
    }

    delete(id: InventoryEntryId): void {
        this.storage.delete(id.id);
    }
}
