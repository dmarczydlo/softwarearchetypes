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

```bash
npm install @softwarearchetypes/accounting
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { AccountingConfiguration, AccountType, ExecuteTransactionEntryType } from '@softwarearchetypes/accounting';

const config = AccountingConfiguration.inMemory();
const facade = config.accountingFacade();

// Create accounts
const cash = facade.createAccount({ name: 'Cash', type: AccountType.ASSET });
const revenue = facade.createAccount({ name: 'Revenue', type: AccountType.REVENUE });

// Execute a balanced transaction
facade.executeTransaction({
  type: 'SALE',
  entries: [
    { accountId: cash.getSuccess(), amount: Money.usd(100), type: ExecuteTransactionEntryType.DEBIT },
    { accountId: revenue.getSuccess(), amount: Money.usd(100), type: ExecuteTransactionEntryType.CREDIT },
  ]
});
```
