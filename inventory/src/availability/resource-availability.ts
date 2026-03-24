import { Result } from '@softwarearchetypes/common';
import { Quantity } from '@softwarearchetypes/quantity';
import { BlockadeId } from './blockade-id';
import { LockRequest } from './lock-request';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';
import { UnlockRequest } from './unlock-request';

export interface ResourceAvailability {
    id(): ResourceAvailabilityId;
    resourceId(): ResourceId;
    lock(request: LockRequest): Result<string, BlockadeId>;
    unlock(request: UnlockRequest): Result<string, BlockadeId>;
    isAvailable(): boolean;
    availableQuantity(): Quantity;
    hasBlockade(blockadeId: BlockadeId): boolean;
    hasExpiredBlockades(): boolean;
    releaseExpired(): BlockadeId[];
}
