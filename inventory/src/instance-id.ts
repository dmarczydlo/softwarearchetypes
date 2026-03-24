import { randomUUID } from 'crypto';

export class InstanceId {
    readonly value: string;

    constructor(value: string) {
        if (value == null) {
            throw new Error('InstanceId value cannot be null');
        }
        this.value = value;
    }

    static random(): InstanceId {
        return new InstanceId(randomUUID());
    }

    static of(value: string): InstanceId {
        return new InstanceId(value);
    }

    equals(other: InstanceId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
