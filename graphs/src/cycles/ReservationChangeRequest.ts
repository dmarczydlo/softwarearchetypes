import { SlotId } from './SlotId.js';
import { OwnerId } from './OwnerId.js';

export class ReservationChangeRequest {
    readonly fromSlot: SlotId;
    readonly toSlot: SlotId;
    readonly userId: OwnerId;

    constructor(fromSlot: SlotId, toSlot: SlotId, userId: OwnerId) {
        this.fromSlot = fromSlot;
        this.toSlot = toSlot;
        this.userId = userId;
    }
}
