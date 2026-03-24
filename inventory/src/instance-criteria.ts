import { BatchId } from './batch-id';
import { Instance } from './instance';
import { SerialNumber } from './serial-number';

export interface InstanceCriteria {
    isSatisfiedBy(instance: Instance): boolean;
}

export function andCriteria(a: InstanceCriteria, b: InstanceCriteria): InstanceCriteria {
    return { isSatisfiedBy: (instance: Instance) => a.isSatisfiedBy(instance) && b.isSatisfiedBy(instance) };
}

export function orCriteria(a: InstanceCriteria, b: InstanceCriteria): InstanceCriteria {
    return { isSatisfiedBy: (instance: Instance) => a.isSatisfiedBy(instance) || b.isSatisfiedBy(instance) };
}

export function notCriteria(a: InstanceCriteria): InstanceCriteria {
    return { isSatisfiedBy: (instance: Instance) => !a.isSatisfiedBy(instance) };
}

export const InstanceCriteriaFactory = {
    any(): InstanceCriteria {
        return { isSatisfiedBy: () => true };
    },

    none(): InstanceCriteria {
        return { isSatisfiedBy: () => false };
    },

    byBatch(batchId: BatchId): InstanceCriteria {
        return {
            isSatisfiedBy: (instance: Instance) => {
                const b = instance.batchId();
                return b !== null && b.equals(batchId);
            },
        };
    },

    bySerial(serialNumber: SerialNumber): InstanceCriteria {
        return {
            isSatisfiedBy: (instance: Instance) => {
                const s = instance.serialNumber();
                return s !== null && s.value === serialNumber.value;
            },
        };
    },

    custom(predicate: (instance: Instance) => boolean): InstanceCriteria {
        return { isSatisfiedBy: predicate };
    },
};
