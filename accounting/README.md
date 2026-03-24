# @softwarearchetypes/accounting

## What is this archetype?

The accounting archetype implements double-entry bookkeeping as a reusable pattern. It provides accounts (with types and validity periods), balanced transactions with debit/credit entries, posting rules that automatically generate derived entries, and query/view models for balances and account statements. It is not limited to financial accounting -- any domain requiring balanced, auditable, two-sided record-keeping can use this archetype.

## When to use this archetype

- You need double-entry bookkeeping (every debit has a matching credit)
- You are building a ledger, wallet system, or financial tracking module
- You need posting rules that automatically create entries in response to events (e.g., "when account X is credited, debit account Y by a percentage")
- You want to track balances, filter entries by date/type, and reverse transactions
- You need projection accounts that aggregate balances from multiple source accounts
- Your domain has any two-sided tracking: loyalty points, carbon credits, internal transfer pricing

## Key concepts

- **Account** - A named account with a type (asset, liability, revenue, expense) and validity period
- **Transaction** - A balanced set of entries; supports constraints (balancing, min entries, min accounts)
- **Entry (AccountCredited / AccountDebited)** - Individual debit or credit entry within a transaction
- **TransactionBuilder** - Fluent builder for constructing valid transactions
- **AccountingFacade** - High-level API: create accounts, execute/reverse transactions, query balances
- **PostingRule** - Automatically generates entries when specific events occur (configurable calculator + eligibility conditions)
- **PostingRulesFacade** - Manages posting rule registration and event-driven execution
- **Balances** - Computes debit/credit/net balances for accounts
- **ProjectionAccount** - Virtual account aggregating balances from multiple real accounts
- **Filter / AccountEntryFilter** - Date and type-based filtering for entries and accounts

## Installation

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/accounting
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { AccountingConfiguration, AccountType, CreateAccount } from '@softwarearchetypes/accounting';
import { Money } from '@softwarearchetypes/quantity';

const facade = AccountingConfiguration.inMemory().facade();

// Create accounts
const cashId = AccountId.generate();
const revenueId = AccountId.generate();
facade.createAccount(new CreateAccount(cashId, 'Cash', 'ASSET'));
facade.createAccount(new CreateAccount(revenueId, 'Revenue', 'REVENUE'));

// Execute a balanced transaction using the fluent builder
const sale = facade.transaction()
  .occurredAt(new Date())
  .appliesAt(new Date())
  .withTypeOf('sale')
  .executing()
  .debitFrom(cashId, Money.usd(100))
  .creditTo(revenueId, Money.usd(100))
  .build();

facade.executeSingle(sale);

// Query balances
console.log(facade.balance(cashId));    // Money USD 100
console.log(facade.balance(revenueId)); // Money USD 100
```

## Real-world usage examples

### Digital wallet system (Stripe-like balance tracking)

Track customer funds across a float account and individual wallet balances. Every top-up debits the platform float and credits the customer wallet; every payout reverses the flow.

```typescript
import { AccountingConfiguration, AccountId, CreateAccount } from '@softwarearchetypes/accounting';
import { Money } from '@softwarearchetypes/quantity';

const facade = AccountingConfiguration.inMemory().facade();

const platformFloat = AccountId.generate();
const customerWallet = AccountId.generate();

facade.createAccount(new CreateAccount(platformFloat, 'Platform Float', 'ASSET'));
facade.createAccount(new CreateAccount(customerWallet, 'Customer Wallet - alice@example.com', 'LIABILITY'));

const now = new Date();

// Customer tops up $50
facade.transfer(platformFloat, customerWallet, Money.usd(50), now, now);

// Customer pays out $20
const payout = facade.transaction()
  .occurredAt(now).appliesAt(now).withTypeOf('payout').executing()
  .debitFrom(customerWallet, Money.usd(20))
  .creditTo(platformFloat, Money.usd(20))
  .build();
facade.executeSingle(payout);

console.log(facade.balance(customerWallet)); // USD 30 remaining
```

---

### Loyalty points ledger (Starbucks Rewards style)

Points are off-balance-sheet entries with an expiry date. FIFO consumption ensures the oldest points are spent first, and expired points are swept into an `expiredPoints` account.

```typescript
import { AccountingConfiguration, AccountId, CreateAccount, EntryAllocationFilterBuilder, Validity } from '@softwarearchetypes/accounting';
import { Money } from '@softwarearchetypes/quantity';

const facade = AccountingConfiguration.inMemory().facade();

const pointsAccount = AccountId.generate();
const expiredPoints = AccountId.generate();

facade.createAccount(CreateAccount.generateOffBalanceAccount(pointsAccount, 'Loyalty Points - customer-42'));
facade.createAccount(CreateAccount.generateOffBalanceAccount(expiredPoints, 'Expired Points Pool'));

const jan1 = new Date(2025, 0, 1);
const jan31 = new Date(2025, 0, 31);
const feb28 = new Date(2025, 1, 28);
const mar1 = new Date(2025, 2, 1);

// Grant 100 points valid until Jan 31
const grant1 = facade.transaction()
  .occurredAt(jan1).appliesAt(jan1).withTypeOf('points_grant').executing()
  .creditTo(pointsAccount, Money.usd(100), Validity.until(jan31))
  .build();

// Grant another 200 points valid until Feb 28
const grant2 = facade.transaction()
  .occurredAt(jan1).appliesAt(jan1).withTypeOf('points_grant').executing()
  .creditTo(pointsAccount, Money.usd(200), Validity.until(feb28))
  .build();

facade.executeMultiple(grant1, grant2);

// Redeem 80 points using FIFO (oldest batch spent first)
const redemption = facade.transaction()
  .occurredAt(jan15).appliesAt(jan15).withTypeOf('points_redemption').executing()
  .debitFrom(pointsAccount, Money.usd(80), EntryAllocationFilterBuilder.fifo(pointsAccount).build())
  .build();
facade.executeSingle(redemption);

// After Jan 31 expires — compensate remaining 20 points from the first grant
const expiringEntryId = /* id of the entry from grant1 */ ...;
const compensation = facade.transaction()
  .occurredAt(mar1).appliesAt(mar1)
  .compensatingExpired(expiringEntryId).withCompensationAccount(expiredPoints)
  .build();
facade.executeSingle(compensation!);

// Only the second grant's 200 points remain
console.log(facade.balance(pointsAccount)); // USD 200
console.log(facade.balance(expiredPoints)); // USD 20 (swept expired remainder)
```

---

### Carbon credit trading platform

Each credit issuance goes to an off-balance registry account. Trades transfer credits between registry accounts and post corresponding cash settlements through asset/liability accounts.

```typescript
import { AccountingConfiguration, AccountId, CreateAccount } from '@softwarearchetypes/accounting';
import { Money } from '@softwarearchetypes/quantity';

const facade = AccountingConfiguration.inMemory().facade();

const sellerRegistry = AccountId.generate();
const buyerRegistry  = AccountId.generate();
const sellerCash     = AccountId.generate();
const buyerCash      = AccountId.generate();

facade.createAccount(CreateAccount.generateOffBalanceAccount(sellerRegistry, 'Carbon Registry - Seller Corp'));
facade.createAccount(CreateAccount.generateOffBalanceAccount(buyerRegistry,  'Carbon Registry - Buyer Inc'));
facade.createAccount(new CreateAccount(sellerCash, 'Cash - Seller Corp', 'ASSET'));
facade.createAccount(new CreateAccount(buyerCash,  'Cash - Buyer Inc',   'ASSET'));

const tradeDate = new Date();

// Issue 500 credits to seller
const issuance = facade.transaction()
  .occurredAt(tradeDate).appliesAt(tradeDate).withTypeOf('credit_issuance').executing()
  .creditTo(sellerRegistry, Money.usd(500))
  .build();
facade.executeSingle(issuance);

// Trade: seller transfers 200 credits to buyer; buyer pays $40 per credit = $8,000
const trade = facade.transaction()
  .occurredAt(tradeDate).appliesAt(tradeDate).withTypeOf('credit_trade').executing()
  .debitFrom(sellerRegistry, Money.usd(200))   // credits leave seller
  .creditTo(buyerRegistry,   Money.usd(200))   // credits arrive at buyer
  .creditTo(sellerCash,      Money.usd(8000))  // cash arrives at seller
  .debitFrom(buyerCash,      Money.usd(8000))  // cash leaves buyer
  .build();
facade.executeSingle(trade);
```

---

### Internal transfer pricing between departments

Inter-department charges use a recharge account as the balancing counterpart. Each department has its own cost-centre account; the central recharge pool absorbs the offsetting entries.

```typescript
import { AccountingConfiguration, AccountId, CreateAccount } from '@softwarearchetypes/accounting';
import { Money } from '@softwarearchetypes/quantity';

const facade = AccountingConfiguration.inMemory().facade();

const engineeringCosts = AccountId.generate();
const marketingCosts   = AccountId.generate();
const internalRecharge = AccountId.generate();

facade.createAccount(new CreateAccount(engineeringCosts, 'Engineering Cost Centre', 'EXPENSE'));
facade.createAccount(new CreateAccount(marketingCosts,   'Marketing Cost Centre',   'EXPENSE'));
facade.createAccount(new CreateAccount(internalRecharge, 'Internal Recharge Pool',  'LIABILITY'));

const billingDate = new Date();

// Engineering charges Marketing $5,000 for platform services
const recharge = facade.transaction()
  .occurredAt(billingDate).appliesAt(billingDate).withTypeOf('internal_recharge').executing()
  .debitFrom(internalRecharge,  Money.usd(5000))  // pool absorbs the offset
  .creditTo(engineeringCosts,   Money.usd(5000))  // engineering recognises income
  .debitFrom(marketingCosts,    Money.usd(5000))  // marketing bears the cost
  .creditTo(internalRecharge,   Money.usd(5000))  // pool balances out
  .build();
facade.executeSingle(recharge);

console.log(facade.balance(engineeringCosts));  // +5,000 (net credit to cost centre)
console.log(facade.balance(marketingCosts));    // -5,000 (net debit to cost centre)
```

---

### Subscription revenue recognition (SaaS like Salesforce)

Cash collected up-front is deferred into a liability account and recognised into revenue month by month. `balanceAsOf` lets you reconstruct the recognised/deferred split at any past date.

```typescript
import { AccountingConfiguration, AccountId, CreateAccount } from '@softwarearchetypes/accounting';
import { Money } from '@softwarearchetypes/quantity';

const facade = AccountingConfiguration.inMemory().facade();

const cash             = AccountId.generate();
const deferredRevenue  = AccountId.generate();
const recognisedRevenue = AccountId.generate();

facade.createAccount(new CreateAccount(cash,              'Cash',               'ASSET'));
facade.createAccount(new CreateAccount(deferredRevenue,   'Deferred Revenue',   'LIABILITY'));
facade.createAccount(new CreateAccount(recognisedRevenue, 'Recognised Revenue', 'REVENUE'));

const jan1  = new Date(2025, 0, 1);
const feb1  = new Date(2025, 1, 1);
const mar1  = new Date(2025, 2, 1);

// Customer pays $1,200 annual subscription upfront on Jan 1
const collection = facade.transaction()
  .occurredAt(jan1).appliesAt(jan1).withTypeOf('subscription_collection').executing()
  .debitFrom(cash,            Money.usd(1200))
  .creditTo(deferredRevenue,  Money.usd(1200))
  .build();
facade.executeSingle(collection);

// Recognise $100/month on the 1st of each month
for (const recognitionDate of [feb1, mar1]) {
  const recognition = facade.transaction()
    .occurredAt(recognitionDate).appliesAt(recognitionDate).withTypeOf('revenue_recognition').executing()
    .debitFrom(deferredRevenue,   Money.usd(100))
    .creditTo(recognisedRevenue,  Money.usd(100))
    .build();
  facade.executeSingle(recognition);
}

// Bi-temporal query: what was the deferred balance at end of January?
console.log(facade.balanceAsOf(deferredRevenue, jan1));  // USD 1,200
console.log(facade.balance(deferredRevenue));             // USD 1,000 (two months recognised)
console.log(facade.balance(recognisedRevenue));           // USD 200
```

---

### Posting rules for automatic fee collection

A posting rule fires every time the `receivables` account is credited, automatically calculating a 2% platform fee and routing it to a `feeIncome` account — no manual step required.

```typescript
import {
  AccountingConfiguration, AccountId, CreateAccount,
  PostingRulesConfiguration, PostingRuleBuilder, EligibilityConditions,
  PostingCalculator, PostingContext, TargetAccounts
} from '@softwarearchetypes/accounting';
import { Money, Percentage } from '@softwarearchetypes/quantity';
import { EntryType } from '@softwarearchetypes/accounting';

// Custom calculator: deduct a percentage of the triggering entries as a fee
class FeeCalculator implements PostingCalculator {
  constructor(private readonly rate: Percentage) {}

  calculate(accounts: TargetAccounts, context: PostingContext) {
    const feeAccount = accounts.getRequired('fee');
    const total = context.triggeringEntries()
      .reduce((sum, e) => sum.add(e.amount), Money.usd(0));
    const fee = total.multiply(this.rate);
    return [
      context.accountingFacade().transaction()
        .occurredAt(context.executionTime()).appliesAt(context.executionTime())
        .withTypeOf('platform_fee').executing()
        .creditTo(feeAccount.id, fee)
        .build()
    ];
  }
}

const clock = () => new Date();
const accountingConfig = AccountingConfiguration.inMemory(clock);
const postingConfig    = PostingRulesConfiguration.inMemory(
  accountingConfig.facade(), accountingConfig.eventPublisher(), clock
);

const facade             = accountingConfig.facade();
const postingRulesFacade = postingConfig.facade();

const incomingPayments = AccountId.generate();
const receivables      = AccountId.generate();
const feeIncome        = AccountId.generate();

facade.createAccount(CreateAccount.generateAssetAccount(incomingPayments, 'Incoming Payments'));
facade.createAccount(CreateAccount.generateAssetAccount(receivables,      'Receivables'));
facade.createAccount(CreateAccount.generateOffBalanceAccount(feeIncome,   'Platform Fee Income'));

// Register the fee rule: trigger on credit to receivables, apply 2% fee
const feeRule = PostingRuleBuilder.createRule('2% Platform Fee')
  .when(
    EligibilityConditions.accountEquals(receivables)
      .and(EligibilityConditions.entryTypeEquals(EntryType.CREDIT))
  )
  .calculateUsing(new FeeCalculator(Percentage.of(2)))
  .transferTo('fee', feeIncome)
  .build();

postingRulesFacade.saveRule(feeRule);

// A $1,000 payment automatically triggers the fee rule
const now = new Date();
facade.transfer(incomingPayments, receivables, Money.usd(1000), now, now);

console.log(facade.balance(receivables)); // USD 1,000
console.log(facade.balance(feeIncome));   // USD 20  (2% of 1,000 — posted automatically)
```
