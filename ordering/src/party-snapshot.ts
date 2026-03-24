import { PartyId } from './party-id.js';

export class PartySnapshot {
    readonly partyId: PartyId;
    readonly name: string;
    readonly contactInfo: string | null;

    constructor(partyId: PartyId, name: string, contactInfo: string | null = null) {
        if (partyId == null) {
            throw new Error("PartyId cannot be null");
        }
        if (name == null || name.trim().length === 0) {
            throw new Error("Party name cannot be null or blank");
        }
        this.partyId = partyId;
        this.name = name;
        this.contactInfo = contactInfo;
    }

    static of(partyId: PartyId, name: string, contactInfo?: string): PartySnapshot {
        return new PartySnapshot(partyId, name, contactInfo ?? null);
    }
}
