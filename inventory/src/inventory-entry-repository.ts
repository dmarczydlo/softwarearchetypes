import { InventoryEntry } from './inventory-entry';
import { InventoryEntryId } from './inventory-entry-id';
import { ProductIdentifier } from './product-identifier';

export interface InventoryEntryRepository {
    save(entry: InventoryEntry): void;
    findById(id: InventoryEntryId): InventoryEntry | null;
    findByProductId(productId: ProductIdentifier): InventoryEntry | null;
    findAll(): InventoryEntry[];
    delete(id: InventoryEntryId): void;
}
