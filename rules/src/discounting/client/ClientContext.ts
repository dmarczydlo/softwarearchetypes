import { Money } from "@softwarearchetypes/quantity";
import { ClientStatus } from "./ClientStatus";

export class ClientContext {
    readonly id: string;
    readonly status: ClientStatus;
    readonly totalExpenses: Money;
    readonly firstOrder: Date;

    constructor(id: string, status: ClientStatus, totalExpenses: Money, firstOrder: Date) {
        this.id = id;
        this.status = status;
        this.totalExpenses = totalExpenses;
        this.firstOrder = firstOrder;
    }
}
