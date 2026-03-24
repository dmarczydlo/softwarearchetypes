export class ProcessStep {
    readonly name: string;

    constructor(name: string) {
        if (!name || name.trim() === '') {
            throw new Error('Process step name cannot be null or blank');
        }
        this.name = name;
    }

    equals(other: ProcessStep): boolean {
        return this.name === other.name;
    }

    toString(): string {
        return this.name;
    }
}
