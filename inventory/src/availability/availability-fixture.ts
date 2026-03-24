import { Quantity } from '@softwarearchetypes/quantity';
import { AvailabilityFacade } from './availability-facade';
import { IndividualResourceAvailability } from './individual-resource-availability';
import { PoolResourceAvailability } from './pool-resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';
import { TemporalResourceAvailability } from './temporal-resource-availability';
import { TimeSlot } from './time-slot';

export class AvailabilityFixture {
    private readonly facade: AvailabilityFacade;
    private readonly _now: () => Date;

    constructor(facade: AvailabilityFacade, now: () => Date) {
        this.facade = facade;
        this._now = now;
    }

    registerTemporalSlot(resourceId: ResourceId, slot: TimeSlot): ResourceAvailabilityId {
        const availability = TemporalResourceAvailability.create(resourceId, slot, this._now);
        return this.facade.register(availability).getSuccess();
    }

    registerIndividual(resourceId: ResourceId): ResourceAvailabilityId {
        const availability = IndividualResourceAvailability.create(resourceId, this._now);
        return this.facade.register(availability).getSuccess();
    }

    registerPool(resourceId: ResourceId, capacity: Quantity): ResourceAvailabilityId {
        const availability = PoolResourceAvailability.create(resourceId, capacity, this._now);
        return this.facade.register(availability).getSuccess();
    }
}
