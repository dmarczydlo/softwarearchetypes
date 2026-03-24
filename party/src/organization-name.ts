export class OrganizationName {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): OrganizationName {
        return new OrganizationName(value);
    }

    asString(): string {
        return this.value;
    }
}
