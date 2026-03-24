import { ResourceId } from './availability/resource-id';
import { InstanceId } from './instance-id';
import { InventoryEntry } from './inventory-entry';
import { InventoryEntryId } from './inventory-entry-id';
import { ProductIdentifier } from './product-identifier';

export class InventoryEntryView {
    readonly id: InventoryEntryId;
    readonly productId: ProductIdentifier;
    readonly productName: string;
    readonly instanceIds: Set<string>;
    readonly instanceToResource: Map<string, string>;

    constructor(
        id: InventoryEntryId,
        productId: ProductIdentifier,
        productName: string,
        instanceIds: Set<string>,
        instanceToResource: Map<string, string>,
    ) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.instanceIds = instanceIds;
        this.instanceToResource = instanceToResource;
    }

    static from(entry: InventoryEntry): InventoryEntryView {
        const instanceIds = new Set<string>();
        for (const id of entry.instances()) {
            instanceIds.add(id.value);
        }
        const instanceToResource = new Map<string, string>();
        for (const [instanceId, resourceId] of entry.instanceToResourceMap()) {
            instanceToResource.set(instanceId.value, resourceId.id ?? '');
        }
        return new InventoryEntryView(
            entry.id,
            entry.productId(),
            entry.product.name,
            instanceIds,
            instanceToResource,
        );
    }

    containsInstance(instanceId: InstanceId): boolean {
        return this.instanceIds.has(instanceId.value);
    }

    getResourceForInstance(instanceId: InstanceId): string | null {
        return this.instanceToResource.get(instanceId.value) ?? null;
    }
}
