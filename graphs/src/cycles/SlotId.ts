export class SlotId {
    readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static of(value: string): SlotId {
        return new SlotId(value);
    }

    equals(other: SlotId): boolean {
        return this.value === other.value;
    }
}
