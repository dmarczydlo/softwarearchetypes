import { DeltaType } from "./delta-type";

export class DeliveryDelta {
    readonly dateDifferenceInDays: number;
    readonly quantityDifference: number;
    readonly type: DeltaType;

    constructor(dateDifferenceInDays: number, quantityDifference: number, type: DeltaType) {
        this.dateDifferenceInDays = dateDifferenceInDays;
        this.quantityDifference = quantityDifference;
        this.type = type;
    }
}
