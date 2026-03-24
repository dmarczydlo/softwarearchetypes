import { EventPublisher } from '@softwarearchetypes/common';
import { AccountingFacade } from '../accounting-facade.js';
import { InMemoryPostingRuleRepository, PostingRuleRepository } from './posting-rule-repository.js';
import { PostingRuleExecutor } from './posting-rule-executor.js';
import { PostingRulesEventHandler } from './posting-rules-event-handler.js';
import { PostingRulesFacade } from './posting-rules-facade.js';

export class PostingRulesConfiguration {
    private readonly postingRuleRepository: PostingRuleRepository;
    private readonly _postingRulesFacade: PostingRulesFacade;
    private readonly _eventHandler: PostingRulesEventHandler;

    constructor(
        postingRuleRepository: PostingRuleRepository,
        postingRulesFacade: PostingRulesFacade,
        eventHandler: PostingRulesEventHandler
    ) {
        this.postingRuleRepository = postingRuleRepository;
        this._postingRulesFacade = postingRulesFacade;
        this._eventHandler = eventHandler;
    }

    static inMemory(accountingFacade: AccountingFacade, eventPublisher: EventPublisher, clock: () => Date): PostingRulesConfiguration {
        const postingRuleRepository: PostingRuleRepository = new InMemoryPostingRuleRepository();
        const postingRuleExecutor = new PostingRuleExecutor(postingRuleRepository);
        const postingRulesFacade = new PostingRulesFacade(postingRuleRepository, postingRuleExecutor, accountingFacade, clock);
        const eventHandler = new PostingRulesEventHandler(postingRulesFacade);

        eventPublisher.register(eventHandler);

        return new PostingRulesConfiguration(postingRuleRepository, postingRulesFacade, eventHandler);
    }

    facade(): PostingRulesFacade {
        return this._postingRulesFacade;
    }

    repository(): PostingRuleRepository {
        return this.postingRuleRepository;
    }

    eventHandler(): PostingRulesEventHandler {
        return this._eventHandler;
    }
}
