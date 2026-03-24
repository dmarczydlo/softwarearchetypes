import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { AddressId } from './address-id.js';
import { AddressUseType } from './address-use-type.js';
import { ZipCode } from './zip-code.js';
import { GeoAddress, GeoAddressDetails } from './geo-address.js';
import { Addresses } from './addresses.js';
import type { AddressesRepository } from './repositories.js';
import type { EventPublisher } from './events/event-publisher.js';
import { AddOrUpdateGeoAddressCommand, RemoveAddressCommand } from './commands/index.js';

export class AddressesFacade {
    private readonly repository: AddressesRepository;
    private readonly publisher: EventPublisher;

    constructor(repository: AddressesRepository, publisher: EventPublisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    handle(command: AddOrUpdateGeoAddressCommand | RemoveAddressCommand): Result<string, AddressId> {
        if (command instanceof AddOrUpdateGeoAddressCommand) return this.handleAddOrUpdate(command);
        if (command instanceof RemoveAddressCommand) return this.handleRemove(command);
        throw new Error('Unknown command type');
    }

    private handleAddOrUpdate(command: AddOrUpdateGeoAddressCommand): Result<string, AddressId> {
        const dto = command.address;
        const useTypes = new Set([...dto.useTypes].map(ut => ut as AddressUseType));
        const geoAddress = new GeoAddress(
            dto.addressId, dto.partyId,
            GeoAddressDetails.from(dto.name, dto.street, dto.building, dto.flat, dto.city, ZipCode.of(dto.zipCode), dto.locale),
            useTypes
        );
        const addresses = this.repository.findFor(command.partyId) ?? Addresses.emptyAddressesFor(command.partyId);
        return addresses.addOrUpdate(geoAddress)
            .peekSuccess(a => this.repository.save(a))
            .peekSuccess(a => this.publisher.publishAll(a.publishedEvents()))
            .map(() => geoAddress.id());
    }

    private handleRemove(command: RemoveAddressCommand): Result<string, AddressId> {
        const addresses = this.repository.findFor(command.partyId) ?? Addresses.emptyAddressesFor(command.partyId);
        return addresses.removeAddressWith(command.addressId)
            .peekSuccess(a => this.repository.save(a))
            .peekSuccess(a => this.publisher.publishAll(a.publishedEvents()))
            .map(() => command.addressId);
    }
}
