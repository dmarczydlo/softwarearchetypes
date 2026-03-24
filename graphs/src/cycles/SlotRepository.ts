import { SlotId } from './SlotId.js';
import { Slot } from './Slot.js';

export interface SlotRepository {
    findById(slotId: SlotId): Slot | null;
    save(slot: Slot): void;
    saveAll(slots: Iterable<Slot>): void;
    findAll(slotIds: Set<SlotId>): Map<SlotId, Slot>;
}

export class InMemorySlotRepository implements SlotRepository {
    private readonly slots: Map<string, Slot> = new Map();

    findById(slotId: SlotId): Slot | null {
        return this.slots.get(slotId.value) ?? null;
    }

    save(slot: Slot): void {
        this.slots.set(slot.id().value, slot);
    }

    findAll(slotIds: Set<SlotId>): Map<SlotId, Slot> {
        const result = new Map<SlotId, Slot>();
        for (const slotId of slotIds) {
            const original = this.findById(slotId);
            if (original) {
                result.set(slotId, Slot.create(original.id(), original.getOwner()));
            }
        }
        return result;
    }

    saveAll(slots: Iterable<Slot>): void {
        for (const slot of slots) {
            this.save(slot);
        }
    }
}
