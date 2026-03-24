import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Capability } from './capability.js';
import { CapabilityId } from './capability-id.js';
import type { CapabilitiesRepository } from './repositories.js';
import type { PartiesQueries } from './queries.js';
import { CapabilityView } from './views.js';
import { AddCapabilityCommand, RemoveCapabilityCommand } from './commands/index.js';

export class CapabilitiesFacade {
    private readonly repository: CapabilitiesRepository;
    private readonly partiesQueries: PartiesQueries;

    constructor(repository: CapabilitiesRepository, partiesQueries: PartiesQueries) {
        this.repository = repository;
        this.partiesQueries = partiesQueries;
    }

    handle(command: AddCapabilityCommand | RemoveCapabilityCommand): Result<string, CapabilityView | CapabilityId> {
        if (command instanceof AddCapabilityCommand) return this.handleAdd(command);
        if (command instanceof RemoveCapabilityCommand) return this.handleRemove(command);
        throw new Error('Unknown command type');
    }

    private handleAdd(command: AddCapabilityCommand): Result<string, CapabilityView> {
        if (!this.partiesQueries.findBy(command.partyId)) {
            return ResultFactory.failure('PARTY_NOT_FOUND');
        }
        const builder = Capability.forParty(command.partyId)
            .type(command.capabilityType)
            .validity(command.validity);
        for (const scope of command.scopes) {
            builder.withScope(scope);
        }
        const capability = builder.build();
        this.repository.save(capability);
        return ResultFactory.success(CapabilityView.from(capability));
    }

    private handleRemove(command: RemoveCapabilityCommand): Result<string, CapabilityId> {
        if (!this.repository.findById(command.capabilityId)) {
            return ResultFactory.failure('CAPABILITY_NOT_FOUND');
        }
        this.repository.remove(command.capabilityId);
        return ResultFactory.success(command.capabilityId);
    }
}
