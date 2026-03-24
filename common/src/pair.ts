export class Pair<T> {
    public readonly first: T;
    public readonly second: T;

    constructor(first: T, second: T) {
        this.first = first;
        this.second = second;
    }

    public static of<T>(first: T, second: T): Pair<T> {
        return new Pair<T>(first, second);
    }

    public equals(other: Pair<T>): boolean {
        return this.first === other.first && this.second === other.second;
    }

    public hashCode(): number {
        let hash: number = 7;
        hash = 31 * hash + (this.first != null ? this.hashValue(this.first) : 0);
        hash = 31 * hash + (this.second != null ? this.hashValue(this.second) : 0);
        return hash;
    }

    public toString(): string {
        return `Pair[first=${this.first}, second=${this.second}]`;
    }

    private hashValue(value: T): number {
        const str: string = String(value);
        let hash: number = 0;
        for (let i: number = 0; i < str.length; i++) {
            const char: number = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash;
    }
}
