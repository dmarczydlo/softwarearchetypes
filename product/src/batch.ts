import { Preconditions } from "@softwarearchetypes/common";
import { Quantity } from "@softwarearchetypes/quantity";
import { randomUUID } from "crypto";
import { ProductIdentifier } from "./product-identifier";
import { SerialNumber } from "./serial-number";
import { ProductType } from "./product-type";

export class BatchId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static newOne(): BatchId {
        return new BatchId(randomUUID());
    }

    static of(value: string): BatchId {
        return new BatchId(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: BatchId): boolean {
        return this.value === other.value;
    }
}

export class BatchName {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "BatchName cannot be null or blank");
        this.value = value;
    }

    static of(value: string): BatchName {
        return new BatchName(value);
    }

    toString(): string {
        return this.value;
    }
}

export class Batch {

    private readonly _id: BatchId;
    private readonly _name: BatchName;
    private readonly _batchOf: ProductIdentifier;
    private readonly _quantityInBatch: Quantity;
    private readonly _dateProduced: Date | null;
    private readonly _sellBy: Date | null;
    private readonly _useBy: Date | null;
    private readonly _bestBefore: Date | null;
    private readonly _startSerialNumber: SerialNumber | null;
    private readonly _endSerialNumber: SerialNumber | null;
    private readonly _comments: string | null;

    constructor(
        id: BatchId,
        name: BatchName,
        productType: ProductType,
        quantityInBatch: Quantity,
        dateProduced: Date | null,
        sellBy: Date | null,
        useBy: Date | null,
        bestBefore: Date | null,
        startSerialNumber: SerialNumber | null,
        endSerialNumber: SerialNumber | null,
        comments: string | null,
    ) {
        Preconditions.checkArgument(id != null, "BatchId must be defined");
        Preconditions.checkArgument(name != null, "BatchName must be defined");
        Preconditions.checkArgument(productType != null, "ProductType must be defined");
        Preconditions.checkArgument(quantityInBatch != null, "Quantity in batch must be defined");
        Preconditions.checkArgument(quantityInBatch.unit.equals(productType.preferredUnit),
            "Batch quantity unit must match ProductType's preferred unit");

        this._id = id;
        this._name = name;
        this._batchOf = productType.id();
        this._quantityInBatch = quantityInBatch;
        this._dateProduced = dateProduced;
        this._sellBy = sellBy;
        this._useBy = useBy;
        this._bestBefore = bestBefore;
        this._startSerialNumber = startSerialNumber;
        this._endSerialNumber = endSerialNumber;
        this._comments = comments;
    }

    get id(): BatchId { return this._id; }
    get name(): BatchName { return this._name; }
    get batchOf(): ProductIdentifier { return this._batchOf; }
    get quantityInBatch(): Quantity { return this._quantityInBatch; }
    get dateProduced(): Date | null { return this._dateProduced; }
    get sellBy(): Date | null { return this._sellBy; }
    get useBy(): Date | null { return this._useBy; }
    get bestBefore(): Date | null { return this._bestBefore; }
    get startSerialNumber(): SerialNumber | null { return this._startSerialNumber; }
    get endSerialNumber(): SerialNumber | null { return this._endSerialNumber; }
    get comments(): string | null { return this._comments; }
}
