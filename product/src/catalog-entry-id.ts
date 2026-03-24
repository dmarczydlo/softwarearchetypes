import { Preconditions } from "@softwarearchetypes/common";
import { randomUUID } from "crypto";

export class CatalogEntryId {
    readonly value: string;

    private constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "CatalogEntryId must be defined");
        this.value = value;
    }

    static of(value: string): CatalogEntryId {
        return new CatalogEntryId(value);
    }

    static generate(): CatalogEntryId {
        return new CatalogEntryId("CATALOG-" + randomUUID());
    }

    toString(): string {
        return this.value;
    }

    equals(other: CatalogEntryId): boolean {
        return this.value === other.value;
    }
}
