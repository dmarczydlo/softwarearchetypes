import { RichLogicalPredicate } from "../../../predicates/RichLogicalPredicate";
import { ClientContext } from "../ClientContext";
import { ClientStatus } from "../ClientStatus";

export class StatusRule extends RichLogicalPredicate<ClientContext> {
    private readonly _status: ClientStatus;

    constructor(status: ClientStatus) {
        super();
        this._status = status;
    }

    static of(status: ClientStatus): StatusRule {
        return new StatusRule(status);
    }

    test(clientContext: ClientContext): boolean {
        return clientContext.status === this._status;
    }

    getStatus(): ClientStatus {
        return this._status;
    }
}
