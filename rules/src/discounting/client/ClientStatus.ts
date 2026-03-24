export enum ClientStatus {
    STANDARD = "STANDARD",
    VIP = "VIP",
    GOLD = "GOLD",
}

export interface ClientStatusVisitor<R> {
    visitStandard(): R;
    visitVIP(): R;
    visitGold(): R;
}

export function acceptClientStatus<R>(status: ClientStatus, visitor: ClientStatusVisitor<R>): R {
    switch (status) {
        case ClientStatus.STANDARD:
            return visitor.visitStandard();
        case ClientStatus.VIP:
            return visitor.visitVIP();
        case ClientStatus.GOLD:
            return visitor.visitGold();
    }
}
