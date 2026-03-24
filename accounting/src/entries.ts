import { Money } from '@softwarearchetypes/quantity';
import { Entry } from './entry.js';

export class Entries {
    private entries: Entry[];

    constructor(entries: Entry[]) {
        this.entries = entries;
    }

    static empty(): Entries {
        return new Entries([]);
    }

    balanceAsOf(when: Date): Money {
        return this.entries
            .filter(e => e.appliesAt().getTime() <= when.getTime())
            .map(e => e.amount())
            .reduce((acc, amount) => acc.add(amount), Money.zeroPln());
    }

    add(entry: Entry): Entries {
        this.entries.push(entry);
        return this;
    }

    addAll(newEntries: Entry[]): Entries {
        this.entries.push(...newEntries);
        return this;
    }

    toList(): Entry[] {
        return [...this.entries];
    }

    amounts(): Money[] {
        return this.entries.map(e => e.amount());
    }

    copy(): Entries {
        return new Entries(this.entries);
    }

    stream(): Entry[] {
        return this.entries;
    }
}
