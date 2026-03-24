import { InstanceId } from './instance-id';
import { TimeSlot } from './availability/time-slot';

export type ResourceSpecificationType = 'TEMPORAL' | 'INDIVIDUAL' | 'QUANTITY';

export interface ResourceSpecification {
    readonly type: ResourceSpecificationType;
}

export class TemporalSpecification implements ResourceSpecification {
    readonly type: ResourceSpecificationType = 'TEMPORAL';
    readonly timeSlots: TimeSlot[];

    constructor(timeSlots: TimeSlot[]) {
        if (!timeSlots) throw new Error('timeSlots cannot be null');
        if (timeSlots.length === 0) throw new Error('timeSlots cannot be empty');
        this.timeSlots = [...timeSlots];
    }

    static of(...slots: TimeSlot[]): TemporalSpecification {
        return new TemporalSpecification(slots);
    }

    static ofList(slots: TimeSlot[]): TemporalSpecification {
        return new TemporalSpecification(slots);
    }
}

export class IndividualSpecification implements ResourceSpecification {
    readonly type: ResourceSpecificationType = 'INDIVIDUAL';
    readonly instanceId: InstanceId;

    constructor(instanceId: InstanceId) {
        if (!instanceId) throw new Error('instanceId cannot be null');
        this.instanceId = instanceId;
    }

    static of(instanceId: InstanceId): IndividualSpecification {
        return new IndividualSpecification(instanceId);
    }
}

export class QuantitySpecification implements ResourceSpecification {
    readonly type: ResourceSpecificationType = 'QUANTITY';

    static instance(): QuantitySpecification {
        return new QuantitySpecification();
    }
}
