import { ProductStock } from "./ProductStock";

export interface InventoryFinder {
    findOverstockedProducts(): ProductStock[];
}
