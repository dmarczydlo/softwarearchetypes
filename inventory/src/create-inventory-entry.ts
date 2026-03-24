import { InventoryProduct } from './inventory-product';

export class CreateInventoryEntry {
    readonly product: InventoryProduct;

    constructor(product: InventoryProduct) {
        if (!product) throw new Error('product cannot be null');
        this.product = product;
    }

    static forProduct(product: InventoryProduct): CreateInventoryEntry {
        return new CreateInventoryEntry(product);
    }
}
