import { Money } from '@softwarearchetypes/quantity';
import { OrderId } from './order-id.js';
import { PartyId } from './party-id.js';

export class BillingRecord {
    readonly orderId: OrderId;
    readonly customerId: PartyId;
    readonly amount: Money;
    readonly dueDate: Date;
    readonly invoiceRequired: boolean;

    constructor(orderId: OrderId, customerId: PartyId, amount: Money, dueDate: Date, invoiceRequired: boolean) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.dueDate = dueDate;
        this.invoiceRequired = invoiceRequired;
    }

    static builder(): BillingRecordBuilder {
        return new BillingRecordBuilder();
    }
}

export class BillingRecordBuilder {
    private _orderId!: OrderId;
    private _customerId!: PartyId;
    private _amount!: Money;
    private _dueDate!: Date;
    private _invoiceRequired = false;

    orderId(orderId: OrderId): this { this._orderId = orderId; return this; }
    customerId(customerId: PartyId): this { this._customerId = customerId; return this; }
    amount(amount: Money): this { this._amount = amount; return this; }
    dueDate(dueDate: Date): this { this._dueDate = dueDate; return this; }
    invoiceRequired(invoiceRequired: boolean): this { this._invoiceRequired = invoiceRequired; return this; }

    build(): BillingRecord {
        return new BillingRecord(this._orderId, this._customerId, this._amount, this._dueDate, this._invoiceRequired);
    }
}

export interface BillingService {
    recordCharge(record: BillingRecord): void;
}

export class FixableBillingService implements BillingService {
    recordCharge(_record: BillingRecord): void {}
}
