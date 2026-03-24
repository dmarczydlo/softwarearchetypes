export class Contribution {
    readonly label: string;
    readonly value: number;

    constructor(label: string, value: number) {
        this.label = label;
        this.value = value;
    }
}
