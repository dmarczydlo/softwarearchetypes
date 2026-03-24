export class OwnerId {
    readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static of(value: string): OwnerId {
        return new OwnerId(value);
    }

    static empty(): OwnerId {
        return new OwnerId('');
    }

    isEmpty(): boolean {
        return !this.value;
    }

    equals(other: OwnerId): boolean {
        return this.value === other.value;
    }
}
