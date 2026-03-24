export class Discount {
    readonly id: string | null;
    readonly name: string;

    constructor(id: string | null, name: string) {
        this.id = id;
        this.name = name;
    }
}
