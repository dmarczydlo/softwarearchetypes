import { AvailabilityConfiguration } from './availability/availability-configuration';
import { AvailabilityFacade } from './availability/availability-facade';
import { InMemoryInstanceRepository } from './in-memory-instance-repository';
import { InMemoryInventoryEntryRepository } from './in-memory-inventory-entry-repository';
import { InstanceRepository } from './instance-repository';
import { InventoryEntryRepository } from './inventory-entry-repository';
import { InventoryFacade } from './inventory-facade';
import { alwaysValidValidator, ProductDefinitionValidator } from './product-definition-validator';

export class InventoryConfiguration {
    private readonly entryRepository: InventoryEntryRepository;
    private readonly instanceRepository: InstanceRepository;
    private readonly productValidator: ProductDefinitionValidator;
    private readonly _availabilityFacade: AvailabilityFacade;
    private readonly _facade: InventoryFacade;

    constructor(
        entryRepository: InventoryEntryRepository,
        instanceRepository: InstanceRepository,
        productValidator: ProductDefinitionValidator,
        availabilityFacade: AvailabilityFacade,
        facade: InventoryFacade,
    ) {
        this.entryRepository = entryRepository;
        this.instanceRepository = instanceRepository;
        this.productValidator = productValidator;
        this._availabilityFacade = availabilityFacade;
        this._facade = facade;
    }

    static inMemory(availabilityConfig?: AvailabilityConfiguration, productValidator?: ProductDefinitionValidator): InventoryConfiguration {
        const avConfig = availabilityConfig ?? AvailabilityConfiguration.inMemory();
        const validator = productValidator ?? alwaysValidValidator();
        const availabilityFacade = avConfig.facade();
        const entryRepository = new InMemoryInventoryEntryRepository();
        const instanceRepository = new InMemoryInstanceRepository();
        const facade = new InventoryFacade(entryRepository, instanceRepository, validator, availabilityFacade);
        return new InventoryConfiguration(entryRepository, instanceRepository, validator, availabilityFacade, facade);
    }

    facade(): InventoryFacade {
        return this._facade;
    }

    availabilityFacade(): AvailabilityFacade {
        return this._availabilityFacade;
    }
}
