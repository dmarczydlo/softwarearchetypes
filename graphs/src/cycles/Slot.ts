import { SlotId } from './SlotId.js';
import { OwnerId } from './OwnerId.js';

export class Slot {
    private readonly slotId: SlotId;
    private owner: OwnerId;

    private constructor(slotId: SlotId, owner: OwnerId) {
        this.slotId = slotId;
        this.owner = owner;
    }

    static create(slotId: SlotId, owner: OwnerId): Slot {
        return new Slot(slotId, owner);
    }

    release(): void {
        this.owner = OwnerId.empty();
    }

    assignTo(newOwner: OwnerId): void {
        this.owner = newOwner;
    }

    getOwner(): OwnerId {
        return this.owner;
    }

    id(): SlotId {
        return this.slotId;
    }
}
