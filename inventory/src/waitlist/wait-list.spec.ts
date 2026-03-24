import { describe, it, expect } from 'vitest';
import { WaitList } from './wait-list';
import { WaitListEntry } from './wait-list-entry';

describe('WaitList', () => {
    it('fifo returns entries in order added', () => {
        const waitList = WaitList.fifo<string>(10);
        waitList.add(WaitListEntry.of('first'));
        waitList.add(WaitListEntry.of('second'));
        waitList.add(WaitListEntry.of('third'));

        expect(waitList.poll()?.payload).toBe('first');
        expect(waitList.poll()?.payload).toBe('second');
        expect(waitList.poll()?.payload).toBe('third');
        expect(waitList.poll()).toBeNull();
    });

    it('priority returns higher priority first', () => {
        const waitList = WaitList.priority<string>(10);
        waitList.add(WaitListEntry.of('low', 3));
        waitList.add(WaitListEntry.of('high', 1));
        waitList.add(WaitListEntry.of('medium', 2));

        expect(waitList.poll()?.payload).toBe('high');
        expect(waitList.poll()?.payload).toBe('medium');
        expect(waitList.poll()?.payload).toBe('low');
    });

    it('criteria selects first matching entry', () => {
        const waitList = WaitList.criteria<number>(10);
        waitList.add(WaitListEntry.of(500));
        waitList.add(WaitListEntry.of(200));
        waitList.add(WaitListEntry.of(100));

        const selected = waitList.selectNext((qty: number) => qty <= 300);
        expect(selected?.payload).toBe(200);
        expect(waitList.size()).toBe(2);
    });

    it('criteria leaves non-matching entries in queue', () => {
        const waitList = WaitList.criteria<number>(10);
        waitList.add(WaitListEntry.of(500));
        waitList.add(WaitListEntry.of(400));

        const selected = waitList.selectNext((qty: number) => qty <= 300);
        expect(selected).toBeNull();
        expect(waitList.size()).toBe(2);
    });

    it('cannot exceed capacity', () => {
        const waitList = WaitList.fifo<string>(2);
        waitList.add(WaitListEntry.of('first'));
        waitList.add(WaitListEntry.of('second'));

        expect(() => waitList.add(WaitListEntry.of('third'))).toThrow('Waitlist full');
    });

    it('can remove entry by id', () => {
        const waitList = WaitList.fifo<string>(10);
        const entry = WaitListEntry.of('to-remove');
        waitList.add(entry);
        waitList.add(WaitListEntry.of('stays'));

        const removed = waitList.removeById(entry.id);
        expect(removed).toBe(true);
        expect(waitList.size()).toBe(1);
        expect(waitList.contains(entry.id)).toBe(false);
    });

    it('peek does not remove entry', () => {
        const waitList = WaitList.fifo<string>(10);
        waitList.add(WaitListEntry.of('peeked'));

        const peeked = waitList.peek();
        expect(peeked?.payload).toBe('peeked');
        expect(waitList.size()).toBe(1);
    });

    it('reports correct available capacity', () => {
        const waitList = WaitList.fifo<string>(5);
        waitList.add(WaitListEntry.of('one'));
        waitList.add(WaitListEntry.of('two'));

        expect(waitList.capacity()).toBe(5);
        expect(waitList.size()).toBe(2);
        expect(waitList.availableCapacity()).toBe(3);
        expect(waitList.isFull()).toBe(false);
    });
});
