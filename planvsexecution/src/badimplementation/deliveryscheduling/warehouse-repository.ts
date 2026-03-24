import { Warehouse } from "./warehouse";

export class WarehouseRepository {
    private readonly storageByRegion: Map<string, Warehouse> = new Map();

    save(warehouse: Warehouse): void {
        this.storageByRegion.set(warehouse.location, warehouse);
    }

    findByRegion(region: string): Warehouse | null {
        return this.storageByRegion.get(region) ?? null;
    }
}
