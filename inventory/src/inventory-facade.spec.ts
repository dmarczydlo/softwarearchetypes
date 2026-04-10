import { describe, it, expect } from 'vitest';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { AvailabilityConfiguration } from './availability/availability-configuration';
import { AvailabilityFixture } from './availability/availability-fixture';
import { OwnerId } from './availability/owner-id';
import { ResourceId } from './availability/resource-id';
import { TimeSlot } from './availability/time-slot';
import { BatchId } from './batch-id';
import { CreateInstance } from './create-instance';
import { CreateInventoryEntry } from './create-inventory-entry';
import { InstanceCriteriaFactory } from './instance-criteria';
import { InstanceId } from './instance-id';
import { InventoryConfiguration } from './inventory-configuration';
import { InventoryFacade } from './inventory-facade';
import { InventoryProduct } from './inventory-product';
import { LockCommand } from './lock-command';
import { ProductIdentifier } from './product-identifier';
import { ProductTrackingStrategy } from './product-tracking-strategy';
import { IndividualSpecification, QuantitySpecification, TemporalSpecification } from './resource-specification';
import { serialNumberOf } from './serial-number';

describe('InventoryFacade', () => {
    const now = () => new Date('2024-06-01T10:00:00Z');
    const availabilityConfig = AvailabilityConfiguration.inMemory(now);
    const config = InventoryConfiguration.inMemory(availabilityConfig);
    const facade = config.facade();
    const availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);

    describe('InventoryEntry tests', () => {
        it('creates inventory entry', () => {
            const laptop = InventoryProduct.individuallyTracked(ProductIdentifier.random(), 'MacBook Pro 16');
            const result = facade.handle(CreateInventoryEntry.forProduct(laptop));
            expect(result.success()).toBe(true);
            const view = facade.findEntry(result.getSuccess());
            expect(view).not.toBeNull();
            expect(view!.productName).toBe('MacBook Pro 16');
            expect(view!.instanceIds.size).toBe(0);
            expect(view!.instanceToResource.size).toBe(0);
        });

        it('finds entry by product id', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            facade.handle(CreateInventoryEntry.forProduct(laptop));
            const found = facade.findEntryByProduct(productId);
            expect(found).not.toBeNull();
            expect(found!.productId.equals(productId)).toBe(true);
        });

        it('finds all entries', () => {
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(InventoryProduct.individuallyTracked(ProductIdentifier.random(), 'Laptop')));
            f.handle(CreateInventoryEntry.forProduct(InventoryProduct.individuallyTracked(ProductIdentifier.random(), 'Projector')));
            f.handle(CreateInventoryEntry.forProduct(InventoryProduct.identical(ProductIdentifier.random(), 'Milk')));
            const all = f.findAllEntries();
            expect(all).toHaveLength(3);
        });
    });

    describe('Instance creation tests', () => {
        it('creates instance and adds to entry', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const entryId = f.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();
            const command = CreateInstance.forProduct(productId).withSerial('SN-12345').build();
            const result = f.createInstance(command);
            expect(result.success()).toBe(true);
            const instanceView = f.findInstance(result.getSuccess());
            expect(instanceView).not.toBeNull();
            expect(instanceView!.serialNumber).toBe('SN-12345');
            const entryView = f.findEntry(entryId);
            expect(entryView).not.toBeNull();
            expect(entryView!.instanceIds.size).toBe(1);
        });

        it('fails to create instance without entry', () => {
            const productId = ProductIdentifier.random();
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const command = CreateInstance.forProduct(productId).withSerial('SN-12345').build();
            const result = f.createInstance(command);
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('No inventory entry found');
        });

        it('creates instance with batch id', () => {
            const productId = ProductIdentifier.random();
            const fuel = InventoryProduct.batchTracked(productId, 'Fuel 95');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(fuel));
            const batchId = BatchId.random();
            const command = CreateInstance.forProduct(productId).withBatch(batchId).build();
            const result = f.createInstance(command);
            expect(result.success()).toBe(true);
            const view = f.findInstance(result.getSuccess());
            expect(view).not.toBeNull();
            expect(view!.batchId).toBe(batchId.toString());
        });

        it('creates instance with features', () => {
            const productId = ProductIdentifier.random();
            const phone = InventoryProduct.individuallyTracked(productId, 'iPhone 15 Pro');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(phone));
            const command = CreateInstance.forProduct(productId)
                .withSerial('SN-12345')
                .withFeatures(new Map([['color', 'silver'], ['storage', '256GB']]))
                .build();
            const result = f.createInstance(command);
            expect(result.success()).toBe(true);
            const view = f.findInstance(result.getSuccess());
            expect(view).not.toBeNull();
            expect(view!.features.get('color')).toBe('silver');
            expect(view!.features.get('storage')).toBe('256GB');
        });
    });

    describe('Instance to Resource mapping tests', () => {
        it('maps instance to resource', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const entryId = f.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();
            const instanceId = f.createInstance(CreateInstance.forProduct(productId).withSerial('SN-001').build()).getSuccess();
            const resourceId = ResourceId.random();
            const result = f.mapInstanceToResource(entryId, instanceId, resourceId);
            expect(result.success()).toBe(true);
            const view = f.findEntry(entryId);
            expect(view).not.toBeNull();
            expect(view!.instanceToResource.get(instanceId.value)).toBe(resourceId.id);
        });
    });

    describe('Remove instance tests', () => {
        it('removes instance from entry', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const entryId = f.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();
            const instanceId = f.createInstance(CreateInstance.forProduct(productId).withSerial('SN-001').build()).getSuccess();
            const result = f.removeInstanceFromEntry(entryId, instanceId);
            expect(result.success()).toBe(true);
            const view = f.findEntry(entryId);
            expect(view).not.toBeNull();
            expect(view!.instanceIds.size).toBe(0);
        });

        it('removing instance also removes resource mapping', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const entryId = f.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();
            const instanceId = f.createInstance(CreateInstance.forProduct(productId).withSerial('SN-001').build()).getSuccess();
            const resourceId = ResourceId.random();
            f.mapInstanceToResource(entryId, instanceId, resourceId);
            f.removeInstanceFromEntry(entryId, instanceId);
            const view = f.findEntry(entryId);
            expect(view).not.toBeNull();
            expect(view!.instanceIds.size).toBe(0);
            expect(view!.instanceToResource.size).toBe(0);
        });
    });

    describe('Instance query tests', () => {
        it('finds instance by serial number', () => {
            const productId = ProductIdentifier.random();
            const phone = InventoryProduct.individuallyTracked(productId, 'iPhone 15 Pro');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(phone));
            f.createInstance(CreateInstance.forProduct(productId).withSerial('UNIQUE-SN-999').build());
            const found = f.findInstanceBySerial(serialNumberOf('UNIQUE-SN-999'));
            expect(found).not.toBeNull();
            expect(found!.serialNumber).toBe('UNIQUE-SN-999');
        });

        it('finds instances by batch', () => {
            const productId = ProductIdentifier.random();
            const fuel = InventoryProduct.batchTracked(productId, 'Fuel 95');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(fuel));
            const batchId = BatchId.random();
            f.createInstance(CreateInstance.forProduct(productId).withBatch(batchId).build());
            f.createInstance(CreateInstance.forProduct(productId).withBatch(batchId).build());
            f.createInstance(CreateInstance.forProduct(productId).withBatch(BatchId.random()).build());
            const instances = f.findInstancesByBatch(batchId);
            expect(instances).toHaveLength(2);
        });
    });

    describe('Counting tests', () => {
        it('counts individually tracked products', () => {
            const productId = ProductIdentifier.random();
            const laptops = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(laptops));
            f.createInstance(CreateInstance.forProduct(productId).withSerial('SN-001').build());
            f.createInstance(CreateInstance.forProduct(productId).withSerial('SN-002').build());
            f.createInstance(CreateInstance.forProduct(productId).withSerial('SN-003').build());
            const count = f.countProduct(productId);
            expect(count.amount).toBe(3);
        });

        it('counts batch tracked products with quantity', () => {
            const productId = ProductIdentifier.random();
            const fuel = InventoryProduct.of(productId, 'Fuel 95', ProductTrackingStrategy.BATCH_TRACKED, Unit.liters());
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(fuel));
            f.createInstance(CreateInstance.forProduct(productId).withBatch(BatchId.random()).withQuantity(Quantity.of(5000, Unit.liters())).build());
            f.createInstance(CreateInstance.forProduct(productId).withBatch(BatchId.random()).withQuantity(Quantity.of(3000, Unit.liters())).build());
            const count = f.countProduct(productId);
            expect(count.amount).toBe(8000);
            expect(count.unit.equals(Unit.liters())).toBe(true);
        });

        it('counts with criteria', () => {
            const productId = ProductIdentifier.random();
            const fuel = InventoryProduct.batchTracked(productId, 'Fuel 95');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(fuel));
            const targetBatch = BatchId.random();
            const otherBatch = BatchId.random();
            f.createInstance(CreateInstance.forProduct(productId).withBatch(targetBatch).build());
            f.createInstance(CreateInstance.forProduct(productId).withBatch(targetBatch).build());
            f.createInstance(CreateInstance.forProduct(productId).withBatch(otherBatch).build());
            const count = f.countProduct(productId, InstanceCriteriaFactory.byBatch(targetBatch));
            expect(count.amount).toBe(2);
        });

        it('returns zero for unknown product', () => {
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const count = f.countProduct(ProductIdentifier.random());
            expect(count.amount).toBe(0);
        });
    });

    describe('Duplicate entry prevention', () => {
        it('fails to create duplicate entry for same product', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro 16');
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            f.handle(CreateInventoryEntry.forProduct(laptop));
            const result = f.handle(CreateInventoryEntry.forProduct(laptop));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('already exists');
        });
    });

    describe('Error handling', () => {
        it('fails to map resource for nonexistent entry', () => {
            const f = InventoryConfiguration.inMemory(AvailabilityConfiguration.inMemory(now)).facade();
            const result = f.mapInstanceToResource(
                { id: 'nonexistent', equals: () => false, toString: () => 'nonexistent' } as any,
                InstanceId.random(), ResourceId.random(),
            );
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('Entry not found');
        });
    });

    describe('LockCommand handling tests', () => {
        it('handles individual lock command', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro');
            const avConfig = AvailabilityConfiguration.inMemory(now);
            const invConfig = InventoryConfiguration.inMemory(avConfig);
            const f = invConfig.facade();
            const avFixture = new AvailabilityFixture(avConfig.facade(), now);
            const entryId = f.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();
            const instanceId = InstanceId.random();
            const resourceId = ResourceId.random();
            avFixture.registerIndividual(resourceId);
            f.mapInstanceToResource(entryId, instanceId, resourceId);
            const owner = OwnerId.random();
            const cmd = new LockCommand(productId, Quantity.of(1, Unit.pieces()), owner, IndividualSpecification.of(instanceId));
            const result = f.handleLock(cmd);
            expect(result.success()).toBe(true);
            expect(result.getSuccess()).toHaveLength(1);
        });

        it('handles pool lock command', () => {
            const productId = ProductIdentifier.random();
            const fuel = InventoryProduct.identical(productId, 'Diesel');
            const avConfig = AvailabilityConfiguration.inMemory(now);
            const invConfig = InventoryConfiguration.inMemory(avConfig);
            const f = invConfig.facade();
            const avFixture = new AvailabilityFixture(avConfig.facade(), now);
            const entryId = f.handle(CreateInventoryEntry.forProduct(fuel)).getSuccess();
            const instanceId = InstanceId.random();
            const resourceId = ResourceId.random();
            avFixture.registerPool(resourceId, Quantity.of(10000, Unit.liters()));
            f.mapInstanceToResource(entryId, instanceId, resourceId);
            const owner = OwnerId.random();
            const cmd = new LockCommand(productId, Quantity.of(500, Unit.liters()), owner, QuantitySpecification.instance());
            const result = f.handleLock(cmd);
            expect(result.success()).toBe(true);
            expect(result.getSuccess()).toHaveLength(1);
        });

        it('handles temporal lock command', () => {
            const productId = ProductIdentifier.random();
            const room = InventoryProduct.individuallyTracked(productId, 'Deluxe Room');
            const avConfig = AvailabilityConfiguration.inMemory(now);
            const invConfig = InventoryConfiguration.inMemory(avConfig);
            const f = invConfig.facade();
            const avFixture = new AvailabilityFixture(avConfig.facade(), now);
            const entryId = f.handle(CreateInventoryEntry.forProduct(room)).getSuccess();
            const instanceId = InstanceId.random();
            const resourceId = ResourceId.random();
            const june15 = TimeSlot.ofLocalDate(2024, 6, 15);
            avFixture.registerTemporalSlot(resourceId, june15);
            f.mapInstanceToResource(entryId, instanceId, resourceId);
            const owner = OwnerId.random();
            const cmd = new LockCommand(productId, Quantity.of(1, Unit.pieces()), owner, TemporalSpecification.of(june15));
            const result = f.handleLock(cmd);
            expect(result.success()).toBe(true);
            expect(result.getSuccess()).toHaveLength(1);
        });

        it('handles multi-slot temporal lock command', () => {
            const productId = ProductIdentifier.random();
            const room = InventoryProduct.individuallyTracked(productId, 'Deluxe Room');
            const avConfig = AvailabilityConfiguration.inMemory(now);
            const invConfig = InventoryConfiguration.inMemory(avConfig);
            const f = invConfig.facade();
            const avFixture = new AvailabilityFixture(avConfig.facade(), now);
            const entryId = f.handle(CreateInventoryEntry.forProduct(room)).getSuccess();
            const instanceId = InstanceId.random();
            const resourceId = ResourceId.random();
            const night1 = TimeSlot.ofLocalDate(2024, 6, 15);
            const night2 = TimeSlot.ofLocalDate(2024, 6, 16);
            const night3 = TimeSlot.ofLocalDate(2024, 6, 17);
            avFixture.registerTemporalSlot(resourceId, night1);
            avFixture.registerTemporalSlot(resourceId, night2);
            avFixture.registerTemporalSlot(resourceId, night3);
            f.mapInstanceToResource(entryId, instanceId, resourceId);
            const owner = OwnerId.random();
            const cmd = new LockCommand(productId, Quantity.of(1, Unit.pieces()), owner, TemporalSpecification.ofList([night1, night2, night3]));
            const result = f.handleLock(cmd);
            expect(result.success()).toBe(true);
            expect(result.getSuccess()).toHaveLength(3);
        });

        it('fails lock when resource unavailable', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro');
            const avConfig = AvailabilityConfiguration.inMemory(now);
            const invConfig = InventoryConfiguration.inMemory(avConfig);
            const f = invConfig.facade();
            const avFixture = new AvailabilityFixture(avConfig.facade(), now);
            const entryId = f.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();
            const instanceId = InstanceId.random();
            const resourceId = ResourceId.random();
            avFixture.registerIndividual(resourceId);
            f.mapInstanceToResource(entryId, instanceId, resourceId);
            const alice = OwnerId.random();
            const bob = OwnerId.random();
            f.handleLock(new LockCommand(productId, Quantity.of(1, Unit.pieces()), alice, IndividualSpecification.of(instanceId)));
            const result = f.handleLock(new LockCommand(productId, Quantity.of(1, Unit.pieces()), bob, IndividualSpecification.of(instanceId)));
            expect(result.failure()).toBe(true);
        });

        it('fails lock when no resource mapped', () => {
            const productId = ProductIdentifier.random();
            const laptop = InventoryProduct.individuallyTracked(productId, 'MacBook Pro');
            const avConfig = AvailabilityConfiguration.inMemory(now);
            const invConfig = InventoryConfiguration.inMemory(avConfig);
            const f = invConfig.facade();
            f.handle(CreateInventoryEntry.forProduct(laptop));
            const instanceId = InstanceId.random();
            const cmd = new LockCommand(productId, Quantity.of(1, Unit.pieces()), OwnerId.random(), IndividualSpecification.of(instanceId));
            const result = f.handleLock(cmd);
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('No resource mapped');
        });
    });
});
