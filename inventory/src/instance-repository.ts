import { BatchId } from './batch-id';
import { InstanceId } from './instance-id';
import { ProductIdentifier } from './product-identifier';
import { ProductInstance } from './product-instance';
import { SerialNumber } from './serial-number';

export interface InstanceRepository {
    save(instance: ProductInstance): void;
    findById(id: InstanceId): ProductInstance | null;
    findBySerialNumber(serialNumber: SerialNumber): ProductInstance | null;
    findByBatchId(batchId: BatchId): ProductInstance[];
    findByProductId(productId: ProductIdentifier): ProductInstance[];
    findAll(): ProductInstance[];
    delete(id: InstanceId): void;
}
