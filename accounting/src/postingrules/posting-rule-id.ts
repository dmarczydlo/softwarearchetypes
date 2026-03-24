import { randomUUID } from 'crypto';

export class PostingRuleId {
    readonly uuid: string;

    constructor(uuid: string) {
        this.uuid = uuid;
    }

    static generate(): PostingRuleId {
        return new PostingRuleId(randomUUID());
    }

    static of(uuid: string): PostingRuleId {
        return new PostingRuleId(uuid);
    }

    toString(): string {
        return this.uuid;
    }
}
