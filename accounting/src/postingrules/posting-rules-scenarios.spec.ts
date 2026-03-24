import { describe, it, expect } from 'vitest';
import { Money, Percentage } from '@softwarearchetypes/quantity';
import { AccountId } from '../account-id.js';
import { AccountView } from '../account-view.js';
import { AccountingConfiguration } from '../accounting-configuration.js';
import { AccountingFacade } from '../accounting-facade.js';
import { CreateAccount } from '../create-account.js';
import { EntryView, EntryType } from '../entry-view.js';
import { Transaction } from '../transaction.js';
import { randomStringWithPrefixOf } from '../random-fixture.js';
import { EligibilityConditions, EligibilityCondition } from './eligibility-condition.js';
import { PostingCalculator } from './posting-calculator.js';
import { PostingContext } from './posting-context.js';
import { PostingRuleBuilder } from './posting-rule-builder.js';
import { PostingRulesConfiguration } from './posting-rules-configuration.js';
import { TargetAccounts } from './target-accounts.js';
import { AccountFinderFactory } from './account-finder.js';
import { ConfigurablePostingRule } from './configurable-posting-rule.js';

const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const NOW = new Date(2022, 1, 2, 12, 50);
const clock = () => NOW;

function createSetup() {
    const accountingConfig = AccountingConfiguration.inMemory(clock);
    const postingRulesConfig = PostingRulesConfiguration.inMemory(accountingConfig.facade(), accountingConfig.eventPublisher(), clock);
    return {
        accountingFacade: accountingConfig.facade(),
        postingRulesFacade: postingRulesConfig.facade()
    };
}

function generateAssetAccount(facade: AccountingFacade): AccountId {
    const accountId = AccountId.generate();
    expect(facade.createAccount(CreateAccount.generateAssetAccount(accountId, randomStringWithPrefixOf("acc"))).isSuccess()).toBe(true);
    return accountId;
}

function generateOffBalanceAccount(facade: AccountingFacade): AccountId {
    const accountId = AccountId.generate();
    expect(facade.createAccount(CreateAccount.generateOffBalanceAccount(accountId, randomStringWithPrefixOf("acc"))).isSuccess()).toBe(true);
    return accountId;
}

class CommissionCalculator implements PostingCalculator {
    private readonly rate: Percentage;
    constructor(rate: Percentage) { this.rate = rate; }
    calculate(accounts: TargetAccounts, context: PostingContext): Transaction[] {
        const commissionAccount = accounts.getRequired("commission");
        let totalAmount = Money.zeroPln();
        for (const e of context.triggeringEntries()) { totalAmount = totalAmount.add(e.amount); }
        const commissionAmount = totalAmount.multiply(this.rate);
        return [
            context.accountingFacade().transaction()
                .occurredAt(context.executionTime()).appliesAt(context.executionTime()).withTypeOf("commission").executing()
                .creditTo(commissionAccount.id, commissionAmount).build()
        ];
    }
}

class PercentageCalculator implements PostingCalculator {
    private readonly rate: Percentage;
    constructor(rate: Percentage) { this.rate = rate; }
    calculate(accounts: TargetAccounts, context: PostingContext): Transaction[] {
        const targetAccount = accounts.getRequired("target");
        let totalAmount = Money.zeroPln();
        for (const e of context.triggeringEntries()) { totalAmount = totalAmount.add(e.amount); }
        const calculatedAmount = totalAmount.multiply(this.rate);
        return [
            context.accountingFacade().transaction()
                .occurredAt(context.executionTime()).appliesAt(context.executionTime()).withTypeOf("percentage_allocation").executing()
                .creditTo(targetAccount.id, calculatedAmount).build()
        ];
    }
}

class FixedAmountCalculator implements PostingCalculator {
    private readonly amount: Money;
    constructor(amount: Money) { this.amount = amount; }
    calculate(accounts: TargetAccounts, context: PostingContext): Transaction[] {
        const targetAccount = accounts.getRequired("target");
        return [
            context.accountingFacade().transaction()
                .occurredAt(context.executionTime()).appliesAt(context.executionTime()).withTypeOf("fixed_amount_deduction").executing()
                .debitFrom(context.triggeringEntries()[0].accountId, this.amount)
                .creditTo(targetAccount.id, this.amount).build()
        ];
    }
}

class MinimumBalanceCondition implements EligibilityCondition {
    private readonly minimumBalance: Money;
    constructor(minimumBalance: Money) { this.minimumBalance = minimumBalance; }
    test(context: PostingContext): boolean {
        const accountId = context.triggeringEntries()[0].accountId;
        const balance = context.accountingFacade().balance(accountId);
        return balance != null && balance.isGreaterThanOrEqualTo(this.minimumBalance);
    }
    and(other: EligibilityCondition): EligibilityCondition {
        return EligibilityConditions.custom(ctx => this.test(ctx) && other.test(ctx));
    }
    or(other: EligibilityCondition): EligibilityCondition {
        return EligibilityConditions.custom(ctx => this.test(ctx) || other.test(ctx));
    }
    negate(): EligibilityCondition {
        return EligibilityConditions.custom(ctx => !this.test(ctx));
    }
}

describe('PostingRulesScenarios', () => {
    it('should execute posting rule when entry is created', () => {
        const { accountingFacade, postingRulesFacade } = createSetup();
        const incomingPaymentsAccount = generateAssetAccount(accountingFacade);
        const receivablesAccount = generateAssetAccount(accountingFacade);
        const commissionAccount = generateOffBalanceAccount(accountingFacade);

        const commissionRule = PostingRuleBuilder.createRule("Commission tracking")
            .when(EligibilityConditions.accountEquals(receivablesAccount).and(EligibilityConditions.entryTypeEquals(EntryType.CREDIT)))
            .calculateUsing(new CommissionCalculator(Percentage.of(2)))
            .transferTo("commission", commissionAccount)
            .build();

        expect(postingRulesFacade.saveRule(commissionRule).isSuccess()).toBe(true);
        expect(accountingFacade.transfer(incomingPaymentsAccount, receivablesAccount, Money.pln(1000), TUESDAY_10_00, TUESDAY_10_00).isSuccess()).toBe(true);

        expect(accountingFacade.balance(commissionAccount)!.equals(Money.pln(20))).toBe(true);
    });

    it('should execute posting rules in priority order when order matters', () => {
        const { accountingFacade, postingRulesFacade } = createSetup();
        const receivablesAccount = generateAssetAccount(accountingFacade);
        const taxAccount = generateAssetAccount(accountingFacade);
        const bonusAccount = generateOffBalanceAccount(accountingFacade);

        const taxRule = PostingRuleBuilder.createRule("Tax deduction")
            .when(EligibilityConditions.accountEquals(receivablesAccount).and(EligibilityConditions.entryTypeEquals(EntryType.CREDIT)))
            .calculateUsing(new FixedAmountCalculator(Money.pln(50)))
            .transferTo("target", taxAccount)
            .priority(10)
            .build();

        const bonusRule = PostingRuleBuilder.createRule("Bonus tracking")
            .when(EligibilityConditions.accountEquals(receivablesAccount).and(EligibilityConditions.entryTypeEquals(EntryType.CREDIT)).and(new MinimumBalanceCondition(Money.pln(1000))))
            .calculateUsing(new PercentageCalculator(Percentage.of(1)))
            .transferTo("target", bonusAccount)
            .priority(20)
            .build();

        expect(postingRulesFacade.saveRule(taxRule).isSuccess()).toBe(true);
        expect(postingRulesFacade.saveRule(bonusRule).isSuccess()).toBe(true);

        expect(accountingFacade.transfer(generateAssetAccount(accountingFacade), receivablesAccount, Money.pln(1000), TUESDAY_10_00, TUESDAY_10_00).isSuccess()).toBe(true);

        expect(accountingFacade.balance(taxAccount)!.equals(Money.pln(50))).toBe(true);
        expect(accountingFacade.balance(receivablesAccount)!.equals(Money.pln(950))).toBe(true);
        expect(accountingFacade.balance(bonusAccount)!.equals(Money.zeroPln())).toBe(true);
    });

    it('should save and find posting rule', () => {
        const { accountingFacade, postingRulesFacade } = createSetup();
        const rule = PostingRuleBuilder.createRule("Test rule")
            .when(EligibilityConditions.accountEquals(generateAssetAccount(accountingFacade)))
            .calculateUsing(new PercentageCalculator(Percentage.of(1)))
            .transferTo("target", generateOffBalanceAccount(accountingFacade))
            .build();

        expect(postingRulesFacade.saveRule(rule).isSuccess()).toBe(true);
        expect(postingRulesFacade.findRule(rule.id())).toBe(rule);
        expect(postingRulesFacade.findAllRules()).toContain(rule);
    });

    it('should delete posting rule', () => {
        const { accountingFacade, postingRulesFacade } = createSetup();
        const rule = PostingRuleBuilder.createRule("Test rule")
            .when(EligibilityConditions.accountEquals(generateAssetAccount(accountingFacade)))
            .calculateUsing(new PercentageCalculator(Percentage.of(1)))
            .transferTo("target", generateOffBalanceAccount(accountingFacade))
            .build();

        expect(postingRulesFacade.saveRule(rule).isSuccess()).toBe(true);
        expect(postingRulesFacade.findRule(rule.id())).toBe(rule);

        expect(postingRulesFacade.deleteRule(rule.id()).isSuccess()).toBe(true);
        expect(postingRulesFacade.findRule(rule.id())).toBeNull();
        expect(postingRulesFacade.findAllRules()).not.toContain(rule);
    });

    it('should update existing posting rule', () => {
        const { accountingFacade, postingRulesFacade } = createSetup();
        const account = generateAssetAccount(accountingFacade);
        const targetAccount = generateOffBalanceAccount(accountingFacade);

        const originalRule = PostingRuleBuilder.createRule("Original rule")
            .when(EligibilityConditions.accountEquals(account))
            .calculateUsing(new PercentageCalculator(Percentage.of(1)))
            .transferTo("target", targetAccount)
            .build();

        expect(postingRulesFacade.saveRule(originalRule).isSuccess()).toBe(true);

        const updatedRule = new ConfigurablePostingRule(
            originalRule.id(), "Updated rule",
            EligibilityConditions.accountEquals(account),
            AccountFinderFactory.fixed("target", targetAccount),
            new PercentageCalculator(Percentage.of(2)),
            50
        );

        expect(postingRulesFacade.saveRule(updatedRule).isSuccess()).toBe(true);

        const found = postingRulesFacade.findRule(originalRule.id());
        expect(found).toBe(updatedRule);
        expect(found!.name()).toBe("Updated rule");
        expect(found!.priority()).toBe(50);
    });

    it('should not execute posting rule when eligibility condition is not met', () => {
        const { accountingFacade, postingRulesFacade } = createSetup();
        const receivablesAccount = generateAssetAccount(accountingFacade);
        const otherAccount = generateAssetAccount(accountingFacade);
        const commissionAccount = generateOffBalanceAccount(accountingFacade);

        const commissionRule = PostingRuleBuilder.createRule("Commission tracking")
            .when(EligibilityConditions.accountEquals(receivablesAccount).and(EligibilityConditions.entryTypeEquals(EntryType.CREDIT)))
            .calculateUsing(new PercentageCalculator(Percentage.of(2)))
            .transferTo("target", commissionAccount)
            .build();

        expect(postingRulesFacade.saveRule(commissionRule).isSuccess()).toBe(true);

        expect(accountingFacade.transfer(generateAssetAccount(accountingFacade), otherAccount, Money.pln(1000), TUESDAY_10_00, TUESDAY_10_00).isSuccess()).toBe(true);

        expect(accountingFacade.balance(commissionAccount)!.equals(Money.zeroPln())).toBe(true);
    });
});
