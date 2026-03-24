import { Result, ResultFactory, Version } from '@softwarearchetypes/common';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { BlockadeId } from './blockade-id';
import { CompositeLockRequest, LockRequest } from './lock-request';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';
import { UnlockRequest } from './unlock-request';

export class CompositeResourceAvailability implements ResourceAvailability {
    private readonly _id: ResourceAvailabilityId;
    private readonly _resourceId: ResourceId;
    private readonly _components: Map<string, ResourceAvailability>;
    private readonly _compositeBlockades: Map<string, Map<string, BlockadeId>>;
    private readonly _version: Version;

    constructor(
        id: ResourceAvailabilityId,
        resourceId: ResourceId,
        components: Map<string, ResourceAvailability>,
        compositeBlockades: Map<string, Map<string, BlockadeId>>,
        version: Version,
    ) {
        this._id = id;
        this._resourceId = resourceId;
        this._components = new Map(components);
        this._compositeBlockades = new Map(compositeBlockades);
        if (components.size === 0) {
            throw new Error('Composite resource must have at least one component');
        }
        this._version = version;
    }

    static create(resourceId: ResourceId, components: Map<string, ResourceAvailability>): CompositeResourceAvailability {
        return new CompositeResourceAvailability(
            ResourceAvailabilityId.random(), resourceId, components, new Map(), Version.initial(),
        );
    }

    static of(resourceId: ResourceId, componentList: ResourceAvailability[]): CompositeResourceAvailability {
        const components = new Map<string, ResourceAvailability>();
        for (const component of componentList) {
            components.set(component.resourceId().id ?? '', component);
        }
        return CompositeResourceAvailability.create(resourceId, components);
    }

    id(): ResourceAvailabilityId { return this._id; }
    resourceId(): ResourceId { return this._resourceId; }

    lock(request: LockRequest): Result<string, BlockadeId> {
        if (!(request instanceof CompositeLockRequest)) {
            return ResultFactory.failure(`Invalid request type. Expected CompositeLockRequest`);
        }
        const compositeRequest = request as CompositeLockRequest;

        for (const componentId of this._components.keys()) {
            const componentRequest = compositeRequest.getRequestForComponent(componentId);
            if (componentRequest === null) {
                return ResultFactory.failure(`Missing lock request for component: ${componentId}`);
            }
        }

        for (const [key, component] of this._components) {
            if (!component.isAvailable()) {
                return ResultFactory.failure(`Component not available: ${key}`);
            }
        }

        const lockedComponents = new Map<string, BlockadeId>();
        const failures: string[] = [];

        for (const [componentId, component] of this._components) {
            const componentRequest = compositeRequest.getRequestForComponent(componentId)!;
            const lockResult = component.lock(componentRequest);
            if (lockResult.isFailure()) {
                failures.push(`${componentId}: ${lockResult.getFailure()}`);
            } else {
                lockedComponents.set(componentId, lockResult.getSuccess());
            }
        }

        if (failures.length > 0) {
            for (const [componentId, blockadeId] of lockedComponents) {
                const component = this._components.get(componentId)!;
                component.unlock(UnlockRequest.of(compositeRequest.owner, blockadeId));
            }
            return ResultFactory.failure(`Failed to lock components: ${failures.join(', ')}`);
        }

        const compositeBlockadeId = BlockadeId.composite([...lockedComponents.values()]);
        this._compositeBlockades.set(compositeBlockadeId.id, lockedComponents);
        return ResultFactory.success(compositeBlockadeId);
    }

    unlock(request: UnlockRequest): Result<string, BlockadeId> {
        const componentBlockades = this._compositeBlockades.get(request.blockadeId.id);
        if (!componentBlockades) {
            return ResultFactory.failure(`Composite blockade not found: ${request.blockadeId}`);
        }

        const failures: string[] = [];
        for (const [componentId, componentBlockadeId] of componentBlockades) {
            const component = this._components.get(componentId)!;
            const componentUnlock = UnlockRequest.of(request.requester, componentBlockadeId);
            const result = component.unlock(componentUnlock);
            if (result.isFailure()) {
                failures.push(`${componentId}: ${result.getFailure()}`);
            }
        }

        if (failures.length > 0) {
            return ResultFactory.failure(`Partial unlock failure: ${failures.join(', ')}`);
        }

        this._compositeBlockades.delete(request.blockadeId.id);
        return ResultFactory.success(request.blockadeId);
    }

    isAvailable(): boolean {
        for (const component of this._components.values()) {
            if (!component.isAvailable()) return false;
        }
        return true;
    }

    availableQuantity(): Quantity {
        return this.isAvailable() ? Quantity.of(1, Unit.pieces()) : Quantity.of(0, Unit.pieces());
    }

    hasBlockade(blockadeId: BlockadeId): boolean {
        return this._compositeBlockades.has(blockadeId.id);
    }

    components(): Map<string, ResourceAvailability> {
        return new Map(this._components);
    }

    getComponent(componentId: string): ResourceAvailability | null {
        return this._components.get(componentId) ?? null;
    }

    version(): Version { return this._version; }

    hasExpiredBlockades(): boolean {
        for (const component of this._components.values()) {
            if (component.hasExpiredBlockades()) return true;
        }
        return false;
    }

    releaseExpired(): BlockadeId[] {
        const released: BlockadeId[] = [];
        for (const component of this._components.values()) {
            released.push(...component.releaseExpired());
        }
        return released;
    }
}
