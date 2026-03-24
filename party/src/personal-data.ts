export class PersonalData {
    readonly firstName: string;
    readonly lastName: string;

    private static readonly EMPTY = '';

    constructor(firstName: string | null, lastName: string | null) {
        this.firstName = firstName ?? PersonalData.EMPTY;
        this.lastName = lastName ?? PersonalData.EMPTY;
    }

    static from(firstName: string | null, lastName: string | null): PersonalData {
        return new PersonalData(firstName, lastName);
    }

    static empty(): PersonalData {
        return new PersonalData(PersonalData.EMPTY, PersonalData.EMPTY);
    }
}
