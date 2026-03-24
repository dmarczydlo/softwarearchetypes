import { Preconditions } from "@softwarearchetypes/common";
import { ProductSet } from "./product-set";
import { SelectionRule } from "./selection-rule";
import { SelectedProduct } from "./selected-product";
import { PackageValidationResult } from "./package-validation-result";

export class PackageStructure {
    private readonly _productSets: Map<string, ProductSet>;
    private readonly _selectionRules: SelectionRule[];

    constructor(productSets: Map<string, ProductSet>, selectionRules: SelectionRule[]) {
        Preconditions.checkArgument(productSets != null && productSets.size > 0, "ProductSets must be defined");
        Preconditions.checkArgument(selectionRules != null && selectionRules.length > 0, "Selection rules must be defined");
        this._productSets = new Map(productSets);
        this._selectionRules = [...selectionRules];
    }

    productSets(): Map<string, ProductSet> {
        return this._productSets;
    }

    selectionRules(): SelectionRule[] {
        return this._selectionRules;
    }

    validate(selection: SelectedProduct[]): PackageValidationResult {
        const errors: string[] = [];
        for (let i = 0; i < this._selectionRules.length; i++) {
            const rule = this._selectionRules[i];
            if (!rule.isSatisfiedBy(selection)) {
                errors.push(`Rule ${i + 1} not satisfied: ${rule}`);
            }
        }
        return errors.length === 0
            ? PackageValidationResult.success()
            : PackageValidationResult.failure(errors);
    }

    toString(): string {
        return `PackageStructure{sets=${this._productSets.size}, rules=${this._selectionRules.length}}`;
    }
}
