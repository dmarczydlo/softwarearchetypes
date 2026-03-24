import { Unit } from '@softwarearchetypes/quantity';
import { ProductIdentifier } from './product-identifier';
import { ProductTrackingStrategy } from './product-tracking-strategy';

export class InventoryProduct {
    readonly productId: ProductIdentifier;
    readonly name: string;
    readonly trackingStrategy: ProductTrackingStrategy;
    readonly preferredUnit: Unit;

    constructor(
        productId: ProductIdentifier,
        name: string,
        trackingStrategy: ProductTrackingStrategy,
        preferredUnit: Unit,
    ) {
        if (!productId) throw new Error('productId cannot be null');
        if (!name) throw new Error('name cannot be null');
        if (!trackingStrategy) throw new Error('trackingStrategy cannot be null');
        this.productId = productId;
        this.name = name;
        this.trackingStrategy = trackingStrategy;
        this.preferredUnit = preferredUnit ?? Unit.pieces();
    }

    static of(productId: ProductIdentifier, name: string, trackingStrategy: ProductTrackingStrategy, preferredUnit: Unit): InventoryProduct {
        return new InventoryProduct(productId, name, trackingStrategy, preferredUnit);
    }

    static unique(productId: ProductIdentifier, name: string): InventoryProduct {
        return new InventoryProduct(productId, name, ProductTrackingStrategy.UNIQUE, Unit.pieces());
    }

    static individuallyTracked(productId: ProductIdentifier, name: string): InventoryProduct {
        return new InventoryProduct(productId, name, ProductTrackingStrategy.INDIVIDUALLY_TRACKED, Unit.pieces());
    }

    static batchTracked(productId: ProductIdentifier, name: string): InventoryProduct {
        return new InventoryProduct(productId, name, ProductTrackingStrategy.BATCH_TRACKED, Unit.pieces());
    }

    static identical(productId: ProductIdentifier, name: string): InventoryProduct {
        return new InventoryProduct(productId, name, ProductTrackingStrategy.IDENTICAL, Unit.pieces());
    }

    isUnique(): boolean {
        return this.trackingStrategy === ProductTrackingStrategy.UNIQUE;
    }

    isIndividuallyTracked(): boolean {
        return this.trackingStrategy === ProductTrackingStrategy.INDIVIDUALLY_TRACKED
            || this.trackingStrategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
    }

    isBatchTracked(): boolean {
        return this.trackingStrategy === ProductTrackingStrategy.BATCH_TRACKED
            || this.trackingStrategy === ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED;
    }

    isIdentical(): boolean {
        return this.trackingStrategy === ProductTrackingStrategy.IDENTICAL;
    }
}
