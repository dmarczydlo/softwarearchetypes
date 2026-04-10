import { Result, ResultFactory } from '@softwarearchetypes/common';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { AvailabilityFacade } from './availability/availability-facade';
import { BlockadeId } from './availability/blockade-id';
import { ResourceId } from './availability/resource-id';
import { CreateInstance } from './create-instance';
import { CreateInventoryEntry } from './create-inventory-entry';
import { InstanceBuilder } from './instance-builder';
import { InstanceCriteria } from './instance-criteria';
import { InstanceId } from './instance-id';
import { InstanceRepository } from './instance-repository';
import { InstanceView } from './instance-view';
import { InventoryEntry } from './inventory-entry';
import { InventoryEntryId } from './inventory-entry-id';
import { InventoryEntryRepository } from './inventory-entry-repository';
import { InventoryEntryView } from './inventory-entry-view';
import { LockCommand } from './lock-command';
import { ProductDefinitionValidator } from './product-definition-validator';
import { ProductIdentifier } from './product-identifier';
import { SerialNumber } from './serial-number';
import { BatchId } from './batch-id';

export class InventoryFacade {
    private readonly entryRepository: InventoryEntryRepository;
    private readonly instanceRepository: InstanceRepository;
    private readonly productValidator: ProductDefinitionValidator;
    private readonly availabilityFacade: AvailabilityFacade;

    constructor(
        entryRepository: InventoryEntryRepository,
        instanceRepository: InstanceRepository,
        productValidator: ProductDefinitionValidator,
        availabilityFacade: AvailabilityFacade,
    ) {
        this.entryRepository = entryRepository;
        this.instanceRepository = instanceRepository;
        this.productValidator = productValidator;
        this.availabilityFacade = availabilityFacade;
    }

    handle(command: CreateInventoryEntry): Result<string, InventoryEntryId> {
        if (this.entryRepository.findByProductId(command.product.productId) !== null) {
            return ResultFactory.failure(`Entry already exists for product: ${command.product.productId}`);
        }
        const entry = InventoryEntry.create(command.product, this.availabilityFacade);
        this.entryRepository.save(entry);
        return ResultFactory.success(entry.id);
    }

    mapInstanceToResource(entryId: InventoryEntryId, instanceId: InstanceId, resourceId: ResourceId): Result<string, InventoryEntryId> {
        const entry = this.entryRepository.findById(entryId);
        if (entry === null) {
            return ResultFactory.failure(`Entry not found: ${entryId}`);
        }
        entry.mapInstanceToResource(instanceId, resourceId);
        this.entryRepository.save(entry);
        return ResultFactory.success(entryId);
    }

    removeInstanceFromEntry(entryId: InventoryEntryId, instanceId: InstanceId): Result<string, InventoryEntryId> {
        const entry = this.entryRepository.findById(entryId);
        if (entry === null) {
            return ResultFactory.failure(`Entry not found: ${entryId}`);
        }
        entry.removeInstance(instanceId);
        this.entryRepository.save(entry);
        return ResultFactory.success(entryId);
    }

    findEntry(entryId: InventoryEntryId): InventoryEntryView | null {
        const entry = this.entryRepository.findById(entryId);
        return entry ? InventoryEntryView.from(entry) : null;
    }

    findEntryByProduct(productId: ProductIdentifier): InventoryEntryView | null {
        const entry = this.entryRepository.findByProductId(productId);
        return entry ? InventoryEntryView.from(entry) : null;
    }

    findAllEntries(): InventoryEntryView[] {
        return this.entryRepository.findAll().map(e => InventoryEntryView.from(e));
    }

    findResourcesForProduct(productId: ProductIdentifier): ResourceId[] {
        const entry = this.entryRepository.findByProductId(productId);
        return entry ? entry.resourceIds() : [];
    }

    countProduct(productId: ProductIdentifier, criteria?: InstanceCriteria): Quantity {
        const entry = this.entryRepository.findByProductId(productId);
        if (entry === null) {
            return Quantity.of(0, Unit.pieces());
        }

        const zero = Quantity.of(0, entry.product.preferredUnit);
        let total = zero;

        for (const instanceId of entry.instances()) {
            const instance = this.instanceRepository.findById(instanceId);
            if (instance !== null) {
                if (!criteria || criteria.isSatisfiedBy(instance)) {
                    total = total.add(instance.effectiveQuantity());
                }
            }
        }

        return total;
    }

    findInstances(productId: ProductIdentifier, criteria: InstanceCriteria): Set<InstanceId> {
        const entry = this.entryRepository.findByProductId(productId);
        if (entry === null) {
            return new Set();
        }

        const result = new Set<InstanceId>();
        for (const instanceId of entry.instances()) {
            const instance = this.instanceRepository.findById(instanceId);
            if (instance !== null && criteria.isSatisfiedBy(instance)) {
                result.add(instance.id);
            }
        }
        return result;
    }

    createInstance(command: CreateInstance): Result<string, InstanceId> {
        const entry = this.entryRepository.findByProductId(command.productId);
        if (entry === null) {
            return ResultFactory.failure(`No inventory entry found for product: ${command.productId}`);
        }

        const validation = this.productValidator.validate(
            command.productId,
            entry.product.trackingStrategy,
            command.features,
        );
        if (validation.failure()) {
            return ResultFactory.failure(validation.getFailure());
        }

        const instance = new InstanceBuilder(InstanceId.random(), command.productId)
            .withSerial(command.serialNumber)
            .withBatch(command.batchId)
            .withQuantity(command.quantity)
            .withFeatures(command.features)
            .build();

        this.instanceRepository.save(instance);
        entry.addInstance(instance);
        this.entryRepository.save(entry);

        return ResultFactory.success(instance.id);
    }

    findInstance(instanceId: InstanceId): InstanceView | null {
        const instance = this.instanceRepository.findById(instanceId);
        return instance ? InstanceView.from(instance) : null;
    }

    findInstanceBySerial(serialNumber: SerialNumber): InstanceView | null {
        const instance = this.instanceRepository.findBySerialNumber(serialNumber);
        return instance ? InstanceView.from(instance) : null;
    }

    findInstancesByBatch(batchId: BatchId): InstanceView[] {
        return this.instanceRepository.findByBatchId(batchId).map(i => InstanceView.from(i));
    }

    findInstancesByProduct(productId: ProductIdentifier): InstanceView[] {
        return this.instanceRepository.findByProductId(productId).map(i => InstanceView.from(i));
    }

    handleLock(cmd: LockCommand): Result<string, BlockadeId[]> {
        const entry = this.entryRepository.findByProductId(cmd.productId);
        if (entry === null) {
            throw new Error(`Product not found: ${cmd.productId}`);
        }
        return entry.handleLock(cmd);
    }
}
