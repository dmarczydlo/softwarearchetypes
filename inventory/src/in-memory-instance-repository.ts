import { BatchId } from './batch-id';
import { InstanceId } from './instance-id';
import { InstanceRepository } from './instance-repository';
import { ProductIdentifier } from './product-identifier';
import { ProductInstance } from './product-instance';
import { SerialNumber } from './serial-number';

export class InMemoryInstanceRepository implements InstanceRepository {
    private readonly instances = new Map<string, ProductInstance>();

    save(instance: ProductInstance): void {
        this.instances.set(instance.id.value, instance);
    }

    findById(id: InstanceId): ProductInstance | null {
        return this.instances.get(id.value) ?? null;
    }

    findBySerialNumber(serialNumber: SerialNumber): ProductInstance | null {
        for (const instance of this.instances.values()) {
            const sn = instance.serialNumber();
            if (sn !== null && sn.value === serialNumber.value) {
                return instance;
            }
        }
        return null;
    }

    findByBatchId(batchId: BatchId): ProductInstance[] {
        return [...this.instances.values()].filter(i => {
            const b = i.batchId();
            return b !== null && b.equals(batchId);
        });
    }

    findByProductId(productId: ProductIdentifier): ProductInstance[] {
        return [...this.instances.values()].filter(i => i.productId.equals(productId));
    }

    findAll(): ProductInstance[] {
        return [...this.instances.values()];
    }

    delete(id: InstanceId): void {
        this.instances.delete(id.value);
    }
}
