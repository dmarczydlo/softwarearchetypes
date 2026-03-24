import { randomUUID } from 'crypto';

export class BlockadeId {
    readonly id: string;

    constructor(id: string) {
        if (id == null) {
            throw new Error('BlockadeId cannot be null');
        }
        this.id = id;
    }

    static random(): BlockadeId {
        return new BlockadeId(randomUUID());
    }

    static of(id: string): BlockadeId {
        return new BlockadeId(id);
    }

    static composite(blockadeIds: BlockadeId[]): BlockadeId {
        const hash = blockadeIds.map(b => b.id).join(':');
        return new BlockadeId(`composite:${hash}`);
    }

    equals(other: BlockadeId): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return this.id;
    }
}
