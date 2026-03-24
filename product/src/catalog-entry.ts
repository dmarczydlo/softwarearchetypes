import { Preconditions } from "@softwarearchetypes/common";
import { Product } from "./product";
import { CatalogEntryId } from "./catalog-entry-id";
import { Validity } from "./validity";

export class CatalogEntry {
    private readonly _id: CatalogEntryId;
    private readonly _displayName: string;
    private readonly _description: string;
    private readonly _product: Product;
    private readonly _categories: Set<string>;
    private readonly _validity: Validity;
    private readonly _metadata: Map<string, string>;

    constructor(
        id: CatalogEntryId,
        displayName: string,
        description: string,
        product: Product,
        categories: Set<string>,
        validity: Validity,
        metadata: Map<string, string>,
    ) {
        Preconditions.checkArgument(id != null, "CatalogEntryId must be defined");
        Preconditions.checkArgument(displayName != null && displayName.trim().length > 0, "Display name must be defined");
        Preconditions.checkArgument(description != null && description.trim().length > 0, "Description must be defined");
        Preconditions.checkArgument(product != null, "Product must be defined");
        Preconditions.checkArgument(validity != null, "Validity must be defined");
        this._id = id;
        this._displayName = displayName;
        this._description = description;
        this._product = product;
        this._categories = categories ?? new Set();
        this._validity = validity;
        this._metadata = metadata ?? new Map();
    }

    static builder(): CatalogEntryBuilder {
        return new CatalogEntryBuilder();
    }

    id(): CatalogEntryId { return this._id; }
    displayName(): string { return this._displayName; }
    description(): string { return this._description; }
    product(): Product { return this._product; }
    categories(): Set<string> { return this._categories; }
    validity(): Validity { return this._validity; }
    metadata(): Map<string, string> { return this._metadata; }

    isAvailableAt(date: string): boolean {
        return this._validity.isValidAt(date);
    }

    isInCategory(category: string): boolean {
        return this._categories.has(category);
    }

    getMetadata(key: string): string | null {
        return this._metadata.get(key) ?? null;
    }

    getMetadataOrDefault(key: string, defaultValue: string): string {
        return this._metadata.get(key) ?? defaultValue;
    }

    hasMetadata(key: string): boolean {
        return this._metadata.has(key);
    }

    withValidity(newValidity: Validity): CatalogEntry {
        return new CatalogEntry(this._id, this._displayName, this._description, this._product,
            this._categories, newValidity, this._metadata);
    }

    withMetadata(newMetadata: Map<string, string>): CatalogEntry {
        return new CatalogEntry(this._id, this._displayName, this._description, this._product,
            this._categories, this._validity, newMetadata);
    }

    equals(other: CatalogEntry): boolean {
        return this._id.equals(other._id);
    }

    toString(): string {
        return `CatalogEntry{id=${this._id}, displayName='${this._displayName}', product=${this._product.name()}, categories=${Array.from(this._categories).join(",")}, validity=${this._validity}}`;
    }
}

export class CatalogEntryBuilder {
    private _id: CatalogEntryId | null = null;
    private _displayName: string | null = null;
    private _description: string | null = null;
    private _product: Product | null = null;
    private _categories: Set<string> = new Set();
    private _validity: Validity | null = null;
    private _metadata: Map<string, string> = new Map();

    id(id: CatalogEntryId | null): CatalogEntryBuilder { this._id = id; return this; }
    displayName(name: string | null): CatalogEntryBuilder { this._displayName = name; return this; }
    description(desc: string | null): CatalogEntryBuilder { this._description = desc; return this; }
    product(product: Product | null): CatalogEntryBuilder { this._product = product; return this; }

    categories(categories: Set<string>): CatalogEntryBuilder {
        this._categories = new Set(categories);
        return this;
    }

    category(category: string): CatalogEntryBuilder {
        this._categories.add(category);
        return this;
    }

    validity(validity: Validity | null): CatalogEntryBuilder { this._validity = validity; return this; }

    metadata(metadata: Map<string, string> | Record<string, string>): CatalogEntryBuilder {
        this._metadata = metadata instanceof Map ? new Map(metadata) : new Map(Object.entries(metadata));
        return this;
    }

    withMetadata(key: string, value: string): CatalogEntryBuilder {
        this._metadata.set(key, value);
        return this;
    }

    build(): CatalogEntry {
        return new CatalogEntry(
            this._id!,
            this._displayName!,
            this._description!,
            this._product!,
            this._categories,
            this._validity!,
            this._metadata,
        );
    }
}
