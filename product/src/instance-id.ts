import { randomUUID } from "crypto";

export class InstanceId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static newOne(): InstanceId {
        return new InstanceId(randomUUID());
    }

    static of(value: string): InstanceId {
        return new InstanceId(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: InstanceId): boolean {
        return this.value === other.value;
    }
}
