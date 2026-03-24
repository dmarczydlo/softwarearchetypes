import { ResultFactory, type Result, Pair } from '@softwarearchetypes/common';
import { PartyId } from './party-id.js';
import { Role } from './role.js';
import { RelationshipName } from './relationship-name.js';
import { PartyRole } from './party-role.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import type { PartyRelationshipView } from './views.js';
import { PartyRelationshipViewMapper } from './view-mappers.js';
import { PartyRoleFactory } from './party-role-factory.js';
import { PartyRelationshipFactory } from './party-relationship-factory.js';
import type { PartyRelationshipRepository, PartyRepository } from './repositories.js';
import type { EventPublisher } from './events/event-publisher.js';
import { PartyRelationshipRemoved } from './events/party-relationship-removed.js';
import { AssignPartyRelationshipCommand, RemovePartyRelationshipCommand } from './commands/index.js';

export class PartyRelationshipsFacade {
    private readonly partyRoleFactory: PartyRoleFactory;
    private readonly partyRelationshipFactory: PartyRelationshipFactory;
    private readonly repository: PartyRelationshipRepository;
    private readonly partyRepository: PartyRepository;
    private readonly eventPublisher: EventPublisher;

    constructor(partyRoleFactory: PartyRoleFactory, partyRelationshipFactory: PartyRelationshipFactory,
                repository: PartyRelationshipRepository, partyRepository: PartyRepository, eventPublisher: EventPublisher) {
        this.partyRoleFactory = partyRoleFactory;
        this.partyRelationshipFactory = partyRelationshipFactory;
        this.repository = repository;
        this.partyRepository = partyRepository;
        this.eventPublisher = eventPublisher;
    }

    handle(command: AssignPartyRelationshipCommand | RemovePartyRelationshipCommand): Result<string, PartyRelationshipView | PartyRelationshipId> {
        if (command instanceof AssignPartyRelationshipCommand) return this.handleAssign(command);
        if (command instanceof RemovePartyRelationshipCommand) return this.handleRemove(command);
        throw new Error('Unknown command type');
    }

    private handleAssign(command: AssignPartyRelationshipCommand): Result<string, PartyRelationshipView> {
        const fromRole = Role.of(command.fromRole);
        const toRole = Role.of(command.toRole);
        const relationshipName = RelationshipName.of(command.relationshipName);

        const fromParty = this.definePartyRoleFor(command.fromPartyId, fromRole);
        const toParty = this.definePartyRoleFor(command.toPartyId, toRole);

        const anyFailure = (f1: string | null, f2: string | null) => f1 ?? f2 ?? 'UNKNOWN';

        return fromParty.combine(toParty, anyFailure, (f, t) => Pair.of(f, t))
            .flatMap(rolesPair => this.partyRelationshipFactory.defineFor(rolesPair.first, rolesPair.second, relationshipName))
            .peekSuccess(relation => this.repository.save(relation))
            .peekSuccess(relation => this.eventPublisher.publish(relation.toPartyRelationshipAddedEvent()))
            .map(PartyRelationshipViewMapper.toView);
    }

    private handleRemove(command: RemovePartyRelationshipCommand): Result<string, PartyRelationshipId> {
        const deletedId = this.repository.delete(command.partyRelationshipId);
        if (deletedId) {
            this.eventPublisher.publish(new PartyRelationshipRemoved(deletedId.asString()));
        }
        return ResultFactory.success(command.partyRelationshipId);
    }

    private definePartyRoleFor(partyId: PartyId, role: Role): Result<string, PartyRole> {
        const party = this.partyRepository.findBy(partyId);
        if (!party) return ResultFactory.failure('PARTY_NOT_FOUND');
        return this.partyRoleFactory.defineFor(party, role);
    }
}
