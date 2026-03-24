import { PartyId } from './party-id.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import { PartiesFacade } from './parties-facade.js';
import { AddressesFacade } from './addresses-facade.js';
import { CapabilitiesFacade } from './capabilities-facade.js';
import { PartyRelationshipsFacade } from './party-relationships-facade.js';
import { PartiesQueries, AddressesQueries, PartyRelationshipsQueries, CapabilitiesQueries } from './queries.js';
import { InMemoryPartyRepository, InMemoryAddressesRepository, InMemoryCapabilitiesRepository, InMemoryPartyRelationshipRepository } from './repositories.js';
import { InMemoryEventsPublisher } from './events/in-memory-events-publisher.js';
import { PartyRoleFactory } from './party-role-factory.js';
import { PartyRelationshipFactory } from './party-relationship-factory.js';

export class PartyConfiguration {
    readonly partiesFacade: PartiesFacade;
    readonly partyRelationshipsFacade: PartyRelationshipsFacade;
    readonly addressesFacade: AddressesFacade;
    readonly capabilitiesFacade: CapabilitiesFacade;
    readonly partiesQueries: PartiesQueries;
    readonly partyRelationshipsQueries: PartyRelationshipsQueries;
    readonly addressesQueries: AddressesQueries;
    readonly capabilitiesQueries: CapabilitiesQueries;
    readonly eventPublisher: InMemoryEventsPublisher;

    private constructor(
        partiesFacade: PartiesFacade, partyRelationshipsFacade: PartyRelationshipsFacade,
        addressesFacade: AddressesFacade, capabilitiesFacade: CapabilitiesFacade,
        partiesQueries: PartiesQueries, partyRelationshipsQueries: PartyRelationshipsQueries,
        addressesQueries: AddressesQueries, capabilitiesQueries: CapabilitiesQueries,
        eventPublisher: InMemoryEventsPublisher
    ) {
        this.partiesFacade = partiesFacade;
        this.partyRelationshipsFacade = partyRelationshipsFacade;
        this.addressesFacade = addressesFacade;
        this.capabilitiesFacade = capabilitiesFacade;
        this.partiesQueries = partiesQueries;
        this.partyRelationshipsQueries = partyRelationshipsQueries;
        this.addressesQueries = addressesQueries;
        this.capabilitiesQueries = capabilitiesQueries;
        this.eventPublisher = eventPublisher;
    }

    static inMemory(): PartyConfiguration {
        const eventPublisher = new InMemoryEventsPublisher();
        const partyRepository = new InMemoryPartyRepository();
        const partyRelationshipRepository = new InMemoryPartyRelationshipRepository();
        const addressesRepository = new InMemoryAddressesRepository();
        const capabilitiesRepository = new InMemoryCapabilitiesRepository();

        const partiesFacade = new PartiesFacade(partyRepository, eventPublisher, () => PartyId.random());
        const partyRoleFactory = new PartyRoleFactory();
        const partyRelationshipFactory = new PartyRelationshipFactory(null, () => PartyRelationshipId.random());
        const partyRelationshipsFacade = new PartyRelationshipsFacade(
            partyRoleFactory, partyRelationshipFactory, partyRelationshipRepository, partyRepository, eventPublisher
        );
        const addressesFacade = new AddressesFacade(addressesRepository, eventPublisher);
        const partiesQueries = new PartiesQueries(partyRepository);
        const partyRelationshipsQueries = new PartyRelationshipsQueries(partyRelationshipRepository);
        const addressesQueries = new AddressesQueries(addressesRepository);
        const capabilitiesQueries = new CapabilitiesQueries(capabilitiesRepository);
        const capabilitiesFacade = new CapabilitiesFacade(capabilitiesRepository, partiesQueries);

        return new PartyConfiguration(
            partiesFacade, partyRelationshipsFacade, addressesFacade, capabilitiesFacade,
            partiesQueries, partyRelationshipsQueries, addressesQueries, capabilitiesQueries, eventPublisher
        );
    }
}
