import { BlockadeId } from './blockade-id';
import { OwnerId } from './owner-id';

export class UnlockRequest {
    readonly requester: OwnerId;
    readonly blockadeId: BlockadeId;

    constructor(requester: OwnerId, blockadeId: BlockadeId) {
        if (!requester) throw new Error('Requester cannot be null');
        if (!blockadeId) throw new Error('BlockadeId cannot be null');
        this.requester = requester;
        this.blockadeId = blockadeId;
    }

    static of(requester: OwnerId, blockadeId: BlockadeId): UnlockRequest {
        return new UnlockRequest(requester, blockadeId);
    }
}
