import { AvailabilityFacade } from './availability-facade';
import { InMemoryResourceAvailabilityRepository } from './in-memory-resource-availability-repository';
import { ResourceAvailabilityRepository } from './resource-availability-repository';

export class AvailabilityConfiguration {
    private readonly _now: () => Date;
    private readonly _repository: ResourceAvailabilityRepository;
    private readonly _facade: AvailabilityFacade;

    constructor(now: () => Date, repository: ResourceAvailabilityRepository, facade: AvailabilityFacade) {
        this._now = now;
        this._repository = repository;
        this._facade = facade;
    }

    static inMemory(now: () => Date = () => new Date()): AvailabilityConfiguration {
        const repository = new InMemoryResourceAvailabilityRepository();
        const facade = new AvailabilityFacade(repository, now);
        return new AvailabilityConfiguration(now, repository, facade);
    }

    facade(): AvailabilityFacade {
        return this._facade;
    }

    now(): () => Date {
        return this._now;
    }
}
