export class DriverAvailability {
    readonly driverId: number;
    readonly driverName: string;
    readonly date: Date;
    private _available: boolean;
    readonly maxDeliveries: number;

    constructor(driverId: number, driverName: string, date: Date, available: boolean, maxDeliveries: number) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.date = date;
        this._available = available;
        this.maxDeliveries = maxDeliveries;
    }

    get available(): boolean {
        return this._available;
    }

    set available(value: boolean) {
        this._available = value;
    }
}
