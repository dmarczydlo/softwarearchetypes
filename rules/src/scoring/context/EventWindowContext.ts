import { CustomerEvent } from "../events/CustomerEvent";
import { WindowContext } from "./WindowContext";

export class EventWindowContext extends WindowContext {
    private readonly _currentEvent: CustomerEvent;

    constructor(base: WindowContext, currentEvent: CustomerEvent) {
        super(base.getCustomerId(), base.getFrom(), base.getTo(), base.getEvents(), base.getMetrics());
        this._currentEvent = currentEvent;
    }

    getCurrentEvent(): CustomerEvent {
        return this._currentEvent;
    }
}
