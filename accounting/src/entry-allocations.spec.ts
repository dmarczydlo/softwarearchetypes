import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountCredited, AccountDebited, Entry, isAccountDebited } from './entry.js';
import { EntryAllocations, EntryAllocationFilterBuilder } from './entry-allocations.js';
import { InMemoryEntryRepository } from './entry-repository.js';
import { MetaData } from './metadata.js';
import { TransactionId } from './transaction-id.js';
import { Validity } from './validity.js';

const TUESDAY_09_00 = new Date(2022, 1, 2, 9, 0);
const TUESDAY_09_10 = new Date(2022, 1, 2, 9, 10);
const TUESDAY_09_20 = new Date(2022, 1, 2, 9, 20);
const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const TUESDAY_11_00 = new Date(2022, 1, 2, 11, 0);
const TUESDAY_12_00 = new Date(2022, 1, 2, 12, 0);

describe('EntryAllocations', () => {
    const entryRepository = new InMemoryEntryRepository();
    const entryAllocations = new EntryAllocations(entryRepository);

    function persisted(entry: Entry): Entry {
        entryRepository.save(entry);
        return entry;
    }

    it('should find oldest entry with fifo strategy', () => {
        const repo = new InMemoryEntryRepository();
        const allocations = new EntryAllocations(repo);
        const accountId = AccountId.generate();
        const entry1 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(100), TUESDAY_09_00, TUESDAY_09_00);
        repo.save(entry1);
        const entry2 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(200), TUESDAY_10_00, TUESDAY_10_00);
        repo.save(entry2);
        const entry3 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(300), TUESDAY_11_00, TUESDAY_11_00);
        repo.save(entry3);
        const entry4 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(400), TUESDAY_12_00, TUESDAY_12_00);
        repo.save(entry4);

        const filter = EntryAllocationFilterBuilder.fifo(accountId).build();
        const result = allocations.findAllocationFor(filter);

        expect(result).not.toBeNull();
        expect(result!.id().value).toBe(entry1.id().value);
    });

    it('should find newest entry with lifo strategy', () => {
        const repo = new InMemoryEntryRepository();
        const allocations = new EntryAllocations(repo);
        const accountId = AccountId.generate();
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(100), TUESDAY_09_00, TUESDAY_09_00));
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(200), TUESDAY_10_00, TUESDAY_10_00));
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(300), TUESDAY_11_00, TUESDAY_11_00));
        const entry4 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(400), TUESDAY_12_00, TUESDAY_12_00);
        repo.save(entry4);

        const filter = EntryAllocationFilterBuilder.lifo(accountId).build();
        const result = allocations.findAllocationFor(filter);

        expect(result).not.toBeNull();
        expect(result!.id().value).toBe(entry4.id().value);
    });

    it('should find specific entry with manual strategy', () => {
        const repo = new InMemoryEntryRepository();
        const allocations = new EntryAllocations(repo);
        const accountId = AccountId.generate();
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(100), TUESDAY_09_00, TUESDAY_09_00));
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(200), TUESDAY_10_00, TUESDAY_10_00));
        const entry3 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(300), TUESDAY_11_00, TUESDAY_11_00);
        repo.save(entry3);
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(400), TUESDAY_12_00, TUESDAY_12_00));

        const filter = EntryAllocationFilterBuilder.manual(entry3.id()).build();
        const result = allocations.findAllocationFor(filter);

        expect(result).not.toBeNull();
        expect(result!.id().value).toBe(entry3.id().value);
    });

    it('should filter by entry type', () => {
        const repo = new InMemoryEntryRepository();
        const allocations = new EntryAllocations(repo);
        const accountId = AccountId.generate();
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(100), TUESDAY_09_00, TUESDAY_09_00));
        const entry2 = AccountDebited.create(accountId, TransactionId.generate(), Money.pln(200), TUESDAY_10_00, TUESDAY_10_00);
        repo.save(entry2);
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(300), TUESDAY_11_00, TUESDAY_11_00));
        repo.save(AccountDebited.create(accountId, TransactionId.generate(), Money.pln(400), TUESDAY_12_00, TUESDAY_12_00));

        const filter = EntryAllocationFilterBuilder.fifo(accountId).withTypeOf('debited').build();
        const result = allocations.findAllocationFor(filter);

        expect(result).not.toBeNull();
        expect(result!.id().value).toBe(entry2.id().value);
        expect(isAccountDebited(result!)).toBe(true);
    });

    it('should filter by validity time', () => {
        const repo = new InMemoryEntryRepository();
        const allocations = new EntryAllocations(repo);
        const accountId = AccountId.generate();
        const validUntil10 = Validity.until(TUESDAY_10_00);
        const validUntil11 = Validity.until(TUESDAY_11_00);
        const validUntil12 = Validity.until(TUESDAY_12_00);
        const alwaysValid = Validity.always();

        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(100), TUESDAY_09_00, TUESDAY_09_00, MetaData.empty(), validUntil10, null));
        const entry2 = AccountCredited.create(accountId, TransactionId.generate(), Money.pln(200), TUESDAY_09_10, TUESDAY_09_10, MetaData.empty(), validUntil11, null);
        repo.save(entry2);
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(300), TUESDAY_09_20, TUESDAY_09_20, MetaData.empty(), validUntil12, null));
        repo.save(AccountCredited.create(accountId, TransactionId.generate(), Money.pln(400), TUESDAY_10_00, TUESDAY_10_00, MetaData.empty(), alwaysValid, null));

        const filter = EntryAllocationFilterBuilder.fifo(accountId)
            .withValidityContaining(new Date(TUESDAY_10_00.getTime() + 30000))
            .build();
        const result = allocations.findAllocationFor(filter);

        expect(result).not.toBeNull();
        expect(result!.id().value).toBe(entry2.id().value);
    });

    it('should return null when no matching entry', () => {
        const repo = new InMemoryEntryRepository();
        const allocations = new EntryAllocations(repo);
        const accountId = AccountId.generate();
        const differentAccountId = AccountId.generate();
        repo.save(AccountCredited.create(differentAccountId, TransactionId.generate(), Money.pln(100), TUESDAY_09_00, TUESDAY_09_00));

        const filter = EntryAllocationFilterBuilder.fifo(accountId).build();
        const result = allocations.findAllocationFor(filter);

        expect(result).toBeNull();
    });
});
