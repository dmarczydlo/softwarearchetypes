import { randomUUID } from "crypto";

export class ComponentId {
    readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    static generate(): ComponentId {
        return new ComponentId(randomUUID());
    }

    toString(): string {
        return this.id;
    }

    equals(other: ComponentId): boolean {
        return this.id === other.id;
    }
}
