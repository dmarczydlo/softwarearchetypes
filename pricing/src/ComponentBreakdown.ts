import { Money } from "@softwarearchetypes/quantity";

export class ComponentBreakdown {
    readonly _name: string;
    readonly contribution: Money;
    readonly children: ComponentBreakdown[];

    constructor(name: string, contribution: Money, children: ComponentBreakdown[] = []) {
        this._name = name;
        this.contribution = contribution;
        this.children = [...children];
    }

    get name(): string {
        return this._name;
    }

    total(): Money {
        return this.contribution;
    }

    format(): string {
        return this.formatWithIndent(0);
    }

    private formatWithIndent(level: number): string {
        const indent = "  ".repeat(level);
        let result = `${indent}${this._name}: ${this.contribution}`;

        if (this.children.length > 0) {
            result += "\n";
            result += this.children
                .map((child, i) => child.formatWithIndent(level + 1))
                .join("\n");
        }

        return result;
    }
}
