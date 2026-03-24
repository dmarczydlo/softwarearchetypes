// Inventory archetype

// Core types
export { BatchId } from './batch-id';
export { InstanceId } from './instance-id';
export { InventoryEntryId } from './inventory-entry-id';
export { ProductIdentifier } from './product-identifier';
export { ProductTrackingStrategy, isTrackedIndividually, isTrackedByBatch, requiresBothTrackingMethods, isInterchangeable } from './product-tracking-strategy';
export { SerialNumber, TextualSerialNumber, serialNumberOf } from './serial-number';
export { ResourceSpecification, ResourceSpecificationType, TemporalSpecification, IndividualSpecification, QuantitySpecification } from './resource-specification';

// Instance
export { Instance } from './instance';
export { ProductInstance } from './product-instance';
export { InstanceBuilder } from './instance-builder';
export { InstanceCriteria, InstanceCriteriaFactory, andCriteria, orCriteria, notCriteria } from './instance-criteria';
export { InstanceView } from './instance-view';
export { InstanceRepository } from './instance-repository';
export { InMemoryInstanceRepository } from './in-memory-instance-repository';

// Inventory entry
export { InventoryProduct } from './inventory-product';
export { InventoryEntry } from './inventory-entry';
export { InventoryEntryView } from './inventory-entry-view';
export { InventoryEntryRepository } from './inventory-entry-repository';
export { InMemoryInventoryEntryRepository } from './in-memory-inventory-entry-repository';

// Commands
export { CreateInstance, CreateInstanceBuilder } from './create-instance';
export { CreateInventoryEntry } from './create-inventory-entry';
export { LockCommand } from './lock-command';

// Validation
export { ProductDefinitionValidator, alwaysValidValidator } from './product-definition-validator';

// Facade & Configuration
export { InventoryFacade } from './inventory-facade';
export { InventoryConfiguration } from './inventory-configuration';

// Availability submodule
export * from './availability/index';

// Reservation submodule
export * from './reservation/index';

// Waitlist submodule
export * from './waitlist/index';
