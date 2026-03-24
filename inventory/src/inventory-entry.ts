import { Result, ResultFactory, Version } from '@softwarearchetypes/common';
import { AvailabilityFacade } from './availability/availability-facade';
import { BlockadeId } from './availability/blockade-id';
import { LockDurationFactory } from './availability/lock-duration';
import { IndividualLockRequest, PoolLockRequest, TemporalLockRequest } from './availability/lock-request';
import { ResourceId } from './availability/resource-id';
import { UnlockRequest } from './availability/unlock-request';
import { Instance } from './instance';
import { InstanceId } from './instance-id';
import { InventoryEntryId } from './inventory-entry-id';
import { InventoryProduct } from './inventory-product';
import { LockCommand } from './lock-command';
import { ProductIdentifier } from './product-identifier';
import {
    IndividualSpecification,
    QuantitySpecification,
    TemporalSpecification,
} from './resource-specification';

export class InventoryEntry {
    readonly id: InventoryEntryId;
    readonly product: InventoryProduct;
    private readonly _instances: Set<string>;
    private readonly _instanceToResource: Map<string, ResourceId>;
    private readonly availabilityFacade: AvailabilityFacade;
    private readonly _version: Version;

    constructor(
        id: InventoryEntryId,
        product: InventoryProduct,
        instances: Set<string> | null,
        instanceToResource: Map<string, ResourceId> | null,
        availabilityFacade: AvailabilityFacade,
        version: Version,
    ) {
        if (!id) throw new Error('InventoryEntryId cannot be null');
        if (!product) throw new Error('InventoryProduct cannot be null');
        this.id = id;
        this.product = product;
        this._instances = instances ? new Set(instances) : new Set();
        this._instanceToResource = instanceToResource ? new Map(instanceToResource) : new Map();
        this.availabilityFacade = availabilityFacade;
        this._version = version;
    }

    static create(product: InventoryProduct, availabilityFacade: AvailabilityFacade): InventoryEntry {
        return new InventoryEntry(
            InventoryEntryId.random(), product, null, null, availabilityFacade, Version.initial(),
        );
    }

    productId(): ProductIdentifier {
        return this.product.productId;
    }

    addInstance(instance: Instance): void {
        this._instances.add(instance.id.value);
    }

    removeInstance(instanceId: InstanceId): void {
        if (this._instances.delete(instanceId.value)) {
            this._instanceToResource.delete(instanceId.value);
        }
    }

    hasInstance(instanceId: InstanceId): boolean {
        return this._instances.has(instanceId.value);
    }

    instances(): Set<InstanceId> {
        const result = new Set<InstanceId>();
        for (const value of this._instances) {
            result.add(InstanceId.of(value));
        }
        return result;
    }

    instanceCount(): number {
        return this._instances.size;
    }

    mapInstanceToResource(instanceId: InstanceId, resourceId: ResourceId): void {
        if (!this._instances.has(instanceId.value)) {
            this._instances.add(instanceId.value);
        }
        this._instanceToResource.set(instanceId.value, resourceId);
    }

    unmapInstanceFromResource(instanceId: InstanceId): void {
        this._instanceToResource.delete(instanceId.value);
    }

    resourceFor(instanceId: InstanceId): ResourceId | null {
        return this._instanceToResource.get(instanceId.value) ?? null;
    }

    instanceFor(resourceId: ResourceId): InstanceId | null {
        for (const [instId, resId] of this._instanceToResource) {
            if (resId.equals(resourceId)) {
                return InstanceId.of(instId);
            }
        }
        return null;
    }

    instanceToResourceMap(): Map<InstanceId, ResourceId> {
        const result = new Map<InstanceId, ResourceId>();
        for (const [instId, resId] of this._instanceToResource) {
            result.set(InstanceId.of(instId), resId);
        }
        return result;
    }

    resourceIds(): ResourceId[] {
        return [...this._instanceToResource.values()];
    }

    hasResource(resourceId: ResourceId): boolean {
        for (const resId of this._instanceToResource.values()) {
            if (resId.equals(resourceId)) return true;
        }
        return false;
    }

    isEmpty(): boolean {
        return this._instances.size === 0;
    }

    version(): Version {
        return this._version;
    }

    handleLock(cmd: LockCommand): Result<string, BlockadeId[]> {
        const spec = cmd.resourceSpecification;
        if (spec instanceof TemporalSpecification) {
            return this.handleTemporalLock(cmd, spec);
        }
        if (spec instanceof IndividualSpecification) {
            return this.handleIndividualLock(cmd, spec);
        }
        if (spec instanceof QuantitySpecification) {
            return this.handleQuantityLock(cmd, spec);
        }
        return ResultFactory.failure('Unknown resource specification type');
    }

    private handleTemporalLock(cmd: LockCommand, temporal: TemporalSpecification): Result<string, BlockadeId[]> {
        if (this._instanceToResource.size === 0) {
            return ResultFactory.failure(`No resources mapped for product: ${cmd.productId}`);
        }

        const resourceId = this._instanceToResource.values().next().value!;
        const blockadeIds: BlockadeId[] = [];

        for (const slot of temporal.timeSlots) {
            const lockRequest = TemporalLockRequest.of(
                resourceId, slot, cmd.owner, LockDurationFactory.indefinite(),
            );
            const lockResult = this.availabilityFacade.lockTemporal(resourceId, lockRequest);
            if (lockResult.isFailure()) {
                this.rollback(blockadeIds, cmd);
                return ResultFactory.failure(lockResult.getFailure());
            }
            blockadeIds.push(lockResult.getSuccess());
        }

        return ResultFactory.success(blockadeIds);
    }

    private handleIndividualLock(cmd: LockCommand, individual: IndividualSpecification): Result<string, BlockadeId[]> {
        const instanceId = individual.instanceId;
        const resourceId = this._instanceToResource.get(instanceId.value);

        if (!resourceId) {
            return ResultFactory.failure(`No resource mapped for instance: ${instanceId}`);
        }

        const lockRequest = IndividualLockRequest.of(
            resourceId, cmd.owner, LockDurationFactory.indefinite(),
        );

        const lockResult = this.availabilityFacade.lockIndividual(resourceId, lockRequest);
        if (lockResult.isFailure()) {
            return ResultFactory.failure(lockResult.getFailure());
        }

        return ResultFactory.success([lockResult.getSuccess()]);
    }

    private handleQuantityLock(cmd: LockCommand, _quantity: QuantitySpecification): Result<string, BlockadeId[]> {
        if (this._instanceToResource.size === 0) {
            return ResultFactory.failure(`No resources mapped for product: ${cmd.productId}`);
        }

        const resourceId = this._instanceToResource.values().next().value!;

        const lockRequest = PoolLockRequest.of(
            resourceId, cmd.quantity, cmd.owner, LockDurationFactory.indefinite(),
        );

        const lockResult = this.availabilityFacade.lockPool(resourceId, lockRequest);
        if (lockResult.isFailure()) {
            return ResultFactory.failure(lockResult.getFailure());
        }

        return ResultFactory.success([lockResult.getSuccess()]);
    }

    private rollback(blockadeIds: BlockadeId[], cmd: LockCommand): void {
        for (const bid of blockadeIds) {
            this.availabilityFacade.handle(UnlockRequest.of(cmd.owner, bid));
        }
    }
}
