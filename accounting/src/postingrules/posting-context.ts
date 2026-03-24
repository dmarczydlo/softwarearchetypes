import { AccountingFacade } from '../accounting-facade.js';
import { EntryView } from '../entry-view.js';
import { BusinessContext, BusinessContextFactory } from './business-context.js';

export class PostingContext {
    private readonly _triggeringEntries: EntryView[];
    private readonly _accountingFacade: AccountingFacade;
    private readonly _executionTime: Date;
    private readonly _businessContext: BusinessContext;

    constructor(
        triggeringEntries: EntryView[],
        accountingFacade: AccountingFacade,
        clockOrExecutionTime: (() => Date) | Date,
        businessContext?: BusinessContext
    ) {
        this._triggeringEntries = [...triggeringEntries];
        this._accountingFacade = accountingFacade;
        if (clockOrExecutionTime instanceof Date) {
            this._executionTime = clockOrExecutionTime;
        } else {
            this._executionTime = clockOrExecutionTime();
        }
        this._businessContext = businessContext ?? BusinessContextFactory.empty();
    }

    triggeringEntries(): EntryView[] {
        return this._triggeringEntries;
    }

    accountingFacade(): AccountingFacade {
        return this._accountingFacade;
    }

    executionTime(): Date {
        return this._executionTime;
    }

    businessContext(): BusinessContext {
        return this._businessContext;
    }
}
