export class Customer {
    readonly id: number;
    readonly name: string;
    private _slaDeliveryDays: number;
    readonly region: string;

    constructor(id: number, name: string, slaDeliveryDays: number, region: string) {
        this.id = id;
        this.name = name;
        this._slaDeliveryDays = slaDeliveryDays;
        this.region = region;
    }

    get slaDeliveryDays(): number {
        return this._slaDeliveryDays;
    }

    set slaDeliveryDays(value: number) {
        this._slaDeliveryDays = value;
    }
}
