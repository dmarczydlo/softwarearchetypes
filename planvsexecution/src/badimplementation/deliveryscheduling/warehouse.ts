export class Warehouse {
    readonly id: number;
    readonly location: string;
    private _dailyCapacity: number;
    private _currentLoad: number;

    constructor(id: number, location: string, dailyCapacity: number, currentLoad: number) {
        this.id = id;
        this.location = location;
        this._dailyCapacity = dailyCapacity;
        this._currentLoad = currentLoad;
    }

    get dailyCapacity(): number {
        return this._dailyCapacity;
    }

    set dailyCapacity(value: number) {
        this._dailyCapacity = value;
    }

    get currentLoad(): number {
        return this._currentLoad;
    }

    set currentLoad(value: number) {
        this._currentLoad = value;
    }

    hasCapacityFor(deliveries: number): boolean {
        return this._currentLoad + deliveries <= this._dailyCapacity;
    }
}
