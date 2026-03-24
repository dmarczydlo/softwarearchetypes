export class UserJourneyId {
    readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static of(value: string): UserJourneyId {
        return new UserJourneyId(value);
    }

    equals(other: UserJourneyId): boolean {
        return this.value === other.value;
    }
}
