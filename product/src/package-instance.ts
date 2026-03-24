import { Preconditions } from "@softwarearchetypes/common";
import { Instance } from "./instance";
import { Product } from "./product";
import { PackageType } from "./package-type";
import { InstanceId } from "./instance-id";
import { SerialNumber } from "./serial-number";
import { BatchId } from "./batch";
import { ProductTrackingStrategyOps } from "./product-tracking-strategy";
import { SelectedInstance } from "./selected-instance";
import { PackageValidationResult } from "./package-validation-result";

export class PackageInstance implements Instance {

    private readonly _id: InstanceId;
    private readonly _packageType: PackageType;
    private readonly _selection: SelectedInstance[];
    private readonly _serialNumber: SerialNumber | null;
    private readonly _batchId: BatchId | null;

    constructor(
        id: InstanceId,
        packageType: PackageType,
        selection: SelectedInstance[],
        serialNumber: SerialNumber | null,
        batchId: BatchId | null,
    ) {
        Preconditions.checkArgument(id != null, "InstanceId must be defined");
        Preconditions.checkArgument(packageType != null, "PackageType must be defined");
        Preconditions.checkArgument(selection != null && selection.length > 0, "Selection cannot be empty");

        PackageInstance.validateTrackingRequirements(packageType, serialNumber, batchId);
        PackageInstance.validateSelection(packageType, selection);

        this._id = id;
        this._packageType = packageType;
        this._selection = [...selection];
        this._serialNumber = serialNumber;
        this._batchId = batchId;
    }

    private static validateTrackingRequirements(packageType: PackageType, serialNumber: SerialNumber | null, batchId: BatchId | null): void {
        Preconditions.checkArgument(serialNumber != null || batchId != null,
            "PackageInstance must have either SerialNumber or BatchId (or both)");

        const strategy = packageType.trackingStrategy();

        if (ProductTrackingStrategyOps.isTrackedIndividually(strategy) && serialNumber == null) {
            throw new Error("PackageType requires individual tracking (strategy: " + strategy + ") but no serial number defined");
        }
        if (ProductTrackingStrategyOps.isTrackedByBatch(strategy) && batchId == null) {
            throw new Error("PackageType requires batch tracking (strategy: " + strategy + ") but no batch id defined");
        }
        if (ProductTrackingStrategyOps.requiresBothTrackingMethods(strategy) && (serialNumber == null || batchId == null)) {
            throw new Error("PackageType requires both individual and batch tracking (strategy: " + strategy + ")");
        }
    }

    private static validateSelection(packageType: PackageType, selection: SelectedInstance[]): void {
        const selectedProducts = selection.map(si => si.toSelectedProduct());
        const result: PackageValidationResult = packageType.validateSelection(selectedProducts);
        if (!result.isValid()) {
            throw new Error("Invalid package selection: " + result.errors().join(", "));
        }
    }

    id(): InstanceId { return this._id; }
    product(): Product { return this._packageType; }
    packageType(): PackageType { return this._packageType; }
    selection(): SelectedInstance[] { return this._selection; }
    serialNumber(): SerialNumber | null { return this._serialNumber; }
    batchId(): BatchId | null { return this._batchId; }

    toString(): string {
        return `PackageInstance{id=${this._id}, type=${this._packageType.name()}, serial=${this._serialNumber ?? "none"}, batch=${this._batchId ?? "none"}, selection=${this._selection.length} products}`;
    }
}
