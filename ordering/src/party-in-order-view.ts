import { PartyInOrder } from './party-in-order.js';

export class PartyInOrderView {
    readonly partyId: string;
    readonly partyName: string;
    readonly roles: Set<string>;

    constructor(partyId: string, partyName: string, roles: Set<string>) {
        this.partyId = partyId;
        this.partyName = partyName;
        this.roles = roles;
    }

    static from(partyInOrder: PartyInOrder): PartyInOrderView {
        const roleNames = new Set<string>();
        for (const role of partyInOrder.roles) {
            roleNames.add(role);
        }
        return new PartyInOrderView(
            partyInOrder.partyId().value,
            partyInOrder.party.name,
            roleNames
        );
    }
}
