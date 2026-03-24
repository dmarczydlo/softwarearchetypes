import { DeliveryStatus } from "./delivery-status";
import { DeliveryDelta } from "./delivery-delta";
import { DeltaType } from "./delta-type";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class DeliveryScheduleEntity {

    private readonly _id: number;
    private readonly _orderId: number;
    private _plannedDate: Date;
    private _plannedQuantity: number;
    private _actualDate: Date | null = null;
    private _actualQuantity: number = 0;
    private _status: DeliveryStatus;
    private _lastModified: Date;
    private _lastModifiedBy: string | null = null;

    constructor(id: number, orderId: number, plannedDate: Date, plannedQuantity: number) {
        this._id = id;
        this._orderId = orderId;
        this._plannedDate = plannedDate;
        this._plannedQuantity = plannedQuantity;
        this._status = DeliveryStatus.PLANNED;
        this._lastModified = new Date();
    }

    updateActualDelivery(actualDate: Date, actualQuantity: number): void {
        this._actualDate = actualDate;
        this._actualQuantity = actualQuantity;
        this._status = DeliveryStatus.DELIVERED;
        this._lastModified = new Date();
    }

    calculateDelta(): DeliveryDelta {
        if (this._actualDate === null) {
            return new DeliveryDelta(0, 0, DeltaType.NO_EXECUTION);
        }

        const dateDiff = Math.round((this._actualDate.getTime() - this._plannedDate.getTime()) / MS_PER_DAY);
        const quantityDiff = this._actualQuantity - this._plannedQuantity;

        let type: DeltaType;
        if (dateDiff === 0 && quantityDiff === 0) {
            type = DeltaType.PERFECT_MATCH;
        } else if (dateDiff > 0) {
            type = DeltaType.LATE;
        } else if (quantityDiff < 0) {
            type = DeltaType.UNDER_DELIVERED;
        } else {
            type = DeltaType.DEVIATION;
        }

        return new DeliveryDelta(dateDiff, quantityDiff, type);
    }

    updatePlan(newPlannedDate: Date, newPlannedQuantity: number, modifiedBy: string): void {
        this._plannedDate = newPlannedDate;
        this._plannedQuantity = newPlannedQuantity;
        this._lastModified = new Date();
        this._lastModifiedBy = modifiedBy;
    }

    simulateIfDeliveredOn(hypotheticalDate: Date, hypotheticalQuantity: number): DeliveryDelta {
        const copy = new DeliveryScheduleEntity(this._id, this._orderId, this._plannedDate, this._plannedQuantity);
        copy.updateActualDelivery(hypotheticalDate, hypotheticalQuantity);
        return copy.calculateDelta();
    }

    get id(): number { return this._id; }
    get orderId(): number { return this._orderId; }
    get plannedDate(): Date { return this._plannedDate; }
    get plannedQuantity(): number { return this._plannedQuantity; }
    get actualDate(): Date | null { return this._actualDate; }
    get actualQuantity(): number { return this._actualQuantity; }
    get status(): DeliveryStatus { return this._status; }
    get lastModified(): Date { return this._lastModified; }
    get lastModifiedBy(): string | null { return this._lastModifiedBy; }
}
