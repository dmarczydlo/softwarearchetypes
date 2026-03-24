export class FindProductTypeCriteria {
    constructor(readonly productId: string) {
        if (productId == null || productId.trim().length === 0) throw new Error("Product ID must be defined");
    }
}

export class FindByTrackingStrategyCriteria {
    constructor(readonly trackingStrategy: string) {
        if (trackingStrategy == null || trackingStrategy.trim().length === 0) throw new Error("Tracking strategy must be defined");
    }
}

export class SearchCatalogCriteria {
    constructor(
        readonly searchText: string | null,
        readonly categories: Set<string> | null,
        readonly availableAt: string | null,
        readonly productTypeId: string | null,
        readonly productTypeFeatures: Map<string, Set<string>> | null,
    ) {}

    static all(): SearchCatalogCriteria {
        return new SearchCatalogCriteria(null, null, null, null, null);
    }

    static byText(searchText: string): SearchCatalogCriteria {
        return new SearchCatalogCriteria(searchText, null, null, null, null);
    }

    static byCategories(categories: Set<string>): SearchCatalogCriteria {
        return new SearchCatalogCriteria(null, categories, null, null, null);
    }

    static availableAt(date: string): SearchCatalogCriteria {
        return new SearchCatalogCriteria(null, null, date, null, null);
    }

    static byProductType(productTypeId: string): SearchCatalogCriteria {
        return new SearchCatalogCriteria(null, null, null, productTypeId, null);
    }

    static byFeatures(features: Map<string, Set<string>>): SearchCatalogCriteria {
        return new SearchCatalogCriteria(null, null, null, null, features);
    }
}

export class FindCatalogEntryCriteria {
    constructor(readonly catalogEntryId: string) {
        if (catalogEntryId == null || catalogEntryId.trim().length === 0) throw new Error("Catalog entry ID must be defined");
    }
}

export class FindByCategoryCriteria {
    constructor(readonly category: string) {
        if (category == null || category.trim().length === 0) throw new Error("Category must be defined");
    }
}

export class FindAvailableAtCriteria {
    constructor(readonly date: string) {
        if (date == null) throw new Error("Date must be defined");
    }
}

export class FindByMetadataCriteria {
    constructor(readonly key: string, readonly value: string | null) {
        if (key == null || key.trim().length === 0) throw new Error("Metadata key must be defined");
    }
}
