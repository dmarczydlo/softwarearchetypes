import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Version } from '@softwarearchetypes/common';
import { PartyId } from './party-id.js';
import { Role } from './role.js';
import { PersonalData } from './personal-data.js';
import { OrganizationName } from './organization-name.js';
import { Party } from './party.js';
import { Person } from './person.js';
import { Company } from './company.js';
import { Organization } from './organization.js';
import { OrganizationUnit } from './organization-unit.js';
import type { PartyRepository } from './repositories.js';
import type { EventPublisher } from './events/event-publisher.js';
import { PartyViewMapper } from './view-mappers.js';
import type { PartyView } from './views.js';
import {
    RegisterPersonCommand, RegisterCompanyCommand, RegisterOrganizationUnitCommand,
    AddRoleCommand, RemoveRoleCommand, AddRegisteredIdentifierCommand,
    RemoveRegisteredIdentifierCommand, UpdatePersonalDataCommand, UpdateOrganizationNameCommand
} from './commands/index.js';

export class PartiesFacade {
    private readonly partyRepository: PartyRepository;
    private readonly eventPublisher: EventPublisher;
    private readonly newPartyIdSupplier: () => PartyId;

    constructor(partyRepository: PartyRepository, eventPublisher: EventPublisher, newPartyIdSupplier?: () => PartyId) {
        this.partyRepository = partyRepository;
        this.eventPublisher = eventPublisher;
        this.newPartyIdSupplier = newPartyIdSupplier ?? (() => PartyId.random());
    }

    handleRegisterPerson(command: RegisterPersonCommand): Result<string, PartyView> {
        const personalData = PersonalData.from(command.firstName, command.lastName);
        const roles = new Set([...command.roles].map(r => Role.of(r)));
        return this.registerPartyAccordingTo(() => new Person(this.newPartyIdSupplier(), personalData, roles, command.registeredIdentifiers, Version.initial()))
            .map(PartyViewMapper.toView);
    }

    handleRegisterCompany(command: RegisterCompanyCommand): Result<string, PartyView> {
        const organizationName = OrganizationName.of(command.organizationName);
        const roles = new Set([...command.roles].map(r => Role.of(r)));
        return this.registerPartyAccordingTo(() => new Company(this.newPartyIdSupplier(), organizationName, roles, command.registeredIdentifiers, Version.initial()))
            .map(PartyViewMapper.toView);
    }

    handleRegisterOrganizationUnit(command: RegisterOrganizationUnitCommand): Result<string, PartyView> {
        const organizationName = OrganizationName.of(command.organizationName);
        const roles = new Set([...command.roles].map(r => Role.of(r)));
        return this.registerPartyAccordingTo(() => new OrganizationUnit(this.newPartyIdSupplier(), organizationName, roles, command.registeredIdentifiers, Version.initial()))
            .map(PartyViewMapper.toView);
    }

    handle(command: RegisterPersonCommand | RegisterCompanyCommand | RegisterOrganizationUnitCommand |
                     AddRoleCommand | RemoveRoleCommand | AddRegisteredIdentifierCommand |
                     RemoveRegisteredIdentifierCommand | UpdatePersonalDataCommand | UpdateOrganizationNameCommand):
        Result<string, PartyView | PartyId> {
        if (command instanceof RegisterPersonCommand) return this.handleRegisterPerson(command);
        if (command instanceof RegisterCompanyCommand) return this.handleRegisterCompany(command);
        if (command instanceof RegisterOrganizationUnitCommand) return this.handleRegisterOrganizationUnit(command);
        if (command instanceof AddRoleCommand) return this.handleAddRole(command);
        if (command instanceof RemoveRoleCommand) return this.handleRemoveRole(command);
        if (command instanceof AddRegisteredIdentifierCommand) return this.handleAddRegisteredIdentifier(command);
        if (command instanceof RemoveRegisteredIdentifierCommand) return this.handleRemoveRegisteredIdentifier(command);
        if (command instanceof UpdatePersonalDataCommand) return this.handleUpdatePersonalData(command);
        if (command instanceof UpdateOrganizationNameCommand) return this.handleUpdateOrganizationName(command);
        throw new Error('Unknown command type');
    }

    private handleAddRole(command: AddRoleCommand): Result<string, PartyId> {
        const role = Role.of(command.role);
        const party = this.partyRepository.findBy(command.partyId);
        if (!party) return ResultFactory.failure('Party not found: ' + command.partyId.asString());
        const result = party.add(role);
        return result
            .peekSuccess(() => this.partyRepository.save(party))
            .peekSuccess(() => this.eventPublisher.publish(party.publishedEvents()))
            .map(() => party.id());
    }

    private handleRemoveRole(command: RemoveRoleCommand): Result<string, PartyId> {
        const role = Role.of(command.role);
        const party = this.partyRepository.findBy(command.partyId);
        if (!party) return ResultFactory.failure('Party not found: ' + command.partyId.asString());
        const result = party.remove(role);
        return result
            .peekSuccess(() => this.partyRepository.save(party))
            .peekSuccess(() => this.eventPublisher.publish(party.publishedEvents()))
            .map(() => party.id());
    }

    private handleAddRegisteredIdentifier(command: AddRegisteredIdentifierCommand): Result<string, PartyId> {
        const party = this.partyRepository.findBy(command.partyId);
        if (!party) return ResultFactory.failure('Party not found: ' + command.partyId.asString());
        const result = party.add(command.registeredIdentifier);
        return result
            .peekSuccess(() => this.partyRepository.save(party))
            .peekSuccess(() => this.eventPublisher.publish(party.publishedEvents()))
            .map(() => party.id());
    }

    private handleRemoveRegisteredIdentifier(command: RemoveRegisteredIdentifierCommand): Result<string, PartyId> {
        const party = this.partyRepository.findBy(command.partyId);
        if (!party) return ResultFactory.failure('Party not found: ' + command.partyId.asString());
        const result = party.remove(command.registeredIdentifier);
        return result
            .peekSuccess(() => this.partyRepository.save(party))
            .peekSuccess(() => this.eventPublisher.publish(party.publishedEvents()))
            .map(() => party.id());
    }

    private handleUpdatePersonalData(command: UpdatePersonalDataCommand): Result<string, PartyView> {
        const personalData = PersonalData.from(command.firstName, command.lastName);
        const party = this.partyRepository.findBy(command.partyId, Person as never);
        if (!party) return ResultFactory.failure('Incorrect party type for: ' + command.partyId.asString() + ', expected: Person');
        const person = party as Person;
        const result = person.update(personalData);
        return result
            .peekSuccess(() => this.partyRepository.save(person))
            .peekSuccess(() => this.eventPublisher.publish(person.publishedEvents()))
            .map(PartyViewMapper.toView);
    }

    private handleUpdateOrganizationName(command: UpdateOrganizationNameCommand): Result<string, PartyView> {
        const organizationName = OrganizationName.of(command.organizationName);
        const party = this.partyRepository.findBy(command.partyId, Organization as never);
        if (!party) return ResultFactory.failure('Incorrect party type for: ' + command.partyId.asString() + ', expected: Organization');
        const org = party as Organization;
        const result = org.updateName(organizationName);
        return result
            .peekSuccess(() => this.partyRepository.save(org))
            .peekSuccess(() => this.eventPublisher.publish(org.publishedEvents()))
            .map(PartyViewMapper.toView);
    }

    private registerPartyAccordingTo(partySupplier: () => Party): Result<string, Party> {
        try {
            const party = partySupplier();
            this.partyRepository.save(party);
            this.eventPublisher.publish(party.toPartyRegisteredEvent());
            return ResultFactory.success(party);
        } catch (ex) {
            return ResultFactory.failure('Party registration failed: ' + (ex instanceof Error ? ex.message : String(ex)));
        }
    }
}
