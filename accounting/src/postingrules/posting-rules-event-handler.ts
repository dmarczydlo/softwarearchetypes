import { EventHandler, PublishedEvent } from '@softwarearchetypes/common';
import { AccountId } from '../account-id.js';
import { EntryId } from '../entry-id.js';
import { EntryView, EntryType } from '../entry-view.js';
import { TransactionId } from '../transaction-id.js';
import { CreditEntryRegistered } from '../events/credit-entry-registered.js';
import { DebitEntryRegistered } from '../events/debit-entry-registered.js';
import { AccountingEvent } from '../events/accounting-event.js';
import { PostingRulesFacade } from './posting-rules-facade.js';

export class PostingRulesEventHandler implements EventHandler {
    private readonly postingRulesFacade: PostingRulesFacade;

    constructor(postingRulesFacade: PostingRulesFacade) {
        this.postingRulesFacade = postingRulesFacade;
    }

    supports(event: PublishedEvent): boolean {
        return event instanceof CreditEntryRegistered || event instanceof DebitEntryRegistered;
    }

    handle(event: PublishedEvent): void {
        if (event instanceof CreditEntryRegistered) {
            this.handleCreditEvent(event);
        } else if (event instanceof DebitEntryRegistered) {
            this.handleDebitEvent(event);
        }
    }

    private handleCreditEvent(event: CreditEntryRegistered): void {
        const entryView = new EntryView(
            new EntryId(event.entryId()),
            EntryType.CREDIT,
            event.amount,
            TransactionId.of(event.transactionId()),
            AccountId.of(event.accountId()),
            event.occurredAt(),
            event.appliesAtDate()
        );
        this.postingRulesFacade.executeRulesFor([entryView]);
    }

    private handleDebitEvent(event: DebitEntryRegistered): void {
        const entryView = new EntryView(
            new EntryId(event.entryId()),
            EntryType.DEBIT,
            event.amount,
            TransactionId.of(event.transactionId()),
            AccountId.of(event.accountId()),
            event.occurredAt(),
            event.appliesAtDate()
        );
        this.postingRulesFacade.executeRulesFor([entryView]);
    }
}
