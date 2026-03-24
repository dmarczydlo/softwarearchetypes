import { ProductIdentifier } from "./product-identifier";
import { ProductType } from "./product-type";
import { ProductTrackingStrategy } from "./product-tracking-strategy";

export interface ProductTypeRepository {
    save(productType: ProductType): void;
    findById(id: ProductIdentifier): ProductType | null;
    findByIdValue(idValue: string): ProductType | null;
    findAll(): Set<ProductType>;
    findByTrackingStrategy(strategy: ProductTrackingStrategy): Set<ProductType>;
    remove(id: ProductIdentifier): void;
}

export class InMemoryProductTypeRepository implements ProductTypeRepository {
    private readonly storage: Map<string, ProductType> = new Map();

    save(productType: ProductType): void {
        this.storage.set(productType.id().toString(), productType);
    }

    findById(id: ProductIdentifier): ProductType | null {
        return this.storage.get(id.toString()) ?? null;
    }

    findByIdValue(idValue: string): ProductType | null {
        for (const pt of this.storage.values()) {
            if (pt.id().toString() === idValue) return pt;
        }
        return null;
    }

    findAll(): Set<ProductType> {
        return new Set(this.storage.values());
    }

    findByTrackingStrategy(strategy: ProductTrackingStrategy): Set<ProductType> {
        const result = new Set<ProductType>();
        for (const pt of this.storage.values()) {
            if (pt.trackingStrategy() === strategy) result.add(pt);
        }
        return result;
    }

    remove(id: ProductIdentifier): void {
        this.storage.delete(id.toString());
    }
}
