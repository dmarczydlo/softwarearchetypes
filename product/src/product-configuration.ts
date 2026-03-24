import { ProductFacade } from "./product-facade";
import { ProductRelationshipsFacade } from "./product-relationships-facade";
import { ProductTypeRepository, InMemoryProductTypeRepository } from "./product-type-repository";
import { ProductCatalog } from "./product-catalog";
import { CatalogEntryRepository, InMemoryCatalogEntryRepository } from "./catalog-entry-repository";
import { ProductRelationshipFactory } from "./product-relationship-factory";
import { InMemoryProductRelationshipRepository } from "./product-relationship-repository";
import { ProductRelationshipId } from "./product-relationship";

export class ProductConfiguration {

    private readonly _productFacade: ProductFacade;
    private readonly _productRelationshipsFacade: ProductRelationshipsFacade;
    private readonly _productTypeRepository: ProductTypeRepository;
    private readonly _productCatalog: ProductCatalog;
    private readonly _catalogEntryRepository: CatalogEntryRepository;

    constructor(
        productFacade: ProductFacade,
        productRelationshipsFacade: ProductRelationshipsFacade,
        productTypeRepository: ProductTypeRepository,
        productCatalog: ProductCatalog,
        catalogEntryRepository: CatalogEntryRepository,
    ) {
        this._productFacade = productFacade;
        this._productRelationshipsFacade = productRelationshipsFacade;
        this._productTypeRepository = productTypeRepository;
        this._productCatalog = productCatalog;
        this._catalogEntryRepository = catalogEntryRepository;
    }

    static inMemory(): ProductConfiguration {
        const productTypeRepository = new InMemoryProductTypeRepository();
        const facade = new ProductFacade(productTypeRepository);
        const productRelationshipRepository = new InMemoryProductRelationshipRepository();
        const productRelationshipFactory = new ProductRelationshipFactory(() => ProductRelationshipId.random());
        const productRelationshipsFacade = new ProductRelationshipsFacade(
            productRelationshipFactory, productRelationshipRepository, productTypeRepository);
        const catalogEntryRepository = new InMemoryCatalogEntryRepository();
        const productCatalog = new ProductCatalog(catalogEntryRepository, productTypeRepository);

        return new ProductConfiguration(
            facade,
            productRelationshipsFacade,
            productTypeRepository,
            productCatalog,
            catalogEntryRepository,
        );
    }

    productFacade(): ProductFacade { return this._productFacade; }
    productRelationshipsFacade(): ProductRelationshipsFacade { return this._productRelationshipsFacade; }
    productTypeRepository(): ProductTypeRepository { return this._productTypeRepository; }
    productCatalog(): ProductCatalog { return this._productCatalog; }
    catalogEntryRepository(): CatalogEntryRepository { return this._catalogEntryRepository; }
}
