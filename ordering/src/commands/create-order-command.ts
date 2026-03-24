export class OrderPartyData {
    readonly partyId: string;
    readonly name: string;
    readonly contactInfo: string;
    readonly roles: Set<string>;

    constructor(partyId: string, name: string, contactInfo: string, roles: Set<string>) {
        this.partyId = partyId;
        this.name = name;
        this.contactInfo = contactInfo;
        this.roles = roles;
    }
}

export class OrderLineData {
    readonly productId: string;
    readonly quantity: number;
    readonly unit: string;
    readonly specification: Map<string, string> | null;
    readonly parties: OrderPartyData[] | null;

    constructor(
        productId: string,
        quantity: number,
        unit: string,
        specification: Map<string, string> | Record<string, string> | null,
        parties: OrderPartyData[] | null
    ) {
        this.productId = productId;
        this.quantity = quantity;
        this.unit = unit;
        if (specification instanceof Map) {
            this.specification = specification;
        } else if (specification != null) {
            this.specification = new Map(Object.entries(specification));
        } else {
            this.specification = null;
        }
        this.parties = parties;
    }
}

export class CreateOrderCommand {
    readonly parties: OrderPartyData[];
    readonly lines: OrderLineData[];

    constructor(parties: OrderPartyData[], lines: OrderLineData[]) {
        this.parties = parties;
        this.lines = lines;
    }
}
