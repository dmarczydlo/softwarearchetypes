import { Address } from './address.js';
import { AddressId } from './address-id.js';
import { PartyId } from './party-id.js';
import { AddressUseType } from './address-use-type.js';
import { AddressDetails } from './address-details.js';
import { ZipCode } from './zip-code.js';
import { Validity } from './validity.js';
import { GeoAddressDefined } from './events/geo-address-defined.js';
import { GeoAddressUpdated } from './events/geo-address-updated.js';
import { GeoAddressRemoved } from './events/geo-address-removed.js';

export class GeoAddressDetails implements AddressDetails {
    constructor(
        public readonly name: string,
        public readonly street: string,
        public readonly building: string,
        public readonly flat: string,
        public readonly city: string,
        public readonly zip: ZipCode,
        public readonly locale: string
    ) {}

    static from(name: string, street: string, building: string, flat: string, city: string, zip: ZipCode, locale: string): GeoAddressDetails {
        return new GeoAddressDetails(name, street, building, flat, city, zip, locale);
    }
}

export class GeoAddress extends Address {
    private readonly geoAddressDetails: GeoAddressDetails;

    constructor(id: AddressId, partyId: PartyId, geoAddressDetails: GeoAddressDetails, useTypes: Set<AddressUseType>, validity?: Validity) {
        super(id, partyId, useTypes, validity);
        this.geoAddressDetails = geoAddressDetails;
    }

    name(): string { return this.geoAddressDetails.name; }
    street(): string { return this.geoAddressDetails.street; }
    building(): string { return this.geoAddressDetails.building; }
    flat(): string { return this.geoAddressDetails.flat; }
    city(): string { return this.geoAddressDetails.city; }
    zip(): ZipCode { return this.geoAddressDetails.zip; }
    locale(): string { return this.geoAddressDetails.locale; }

    addressDetails(): AddressDetails { return this.geoAddressDetails; }

    toAddressUpdateSucceededEvent(): GeoAddressUpdated {
        return new GeoAddressUpdated(this.id().asString(), this.partyId().asString(), this.geoAddressDetails.name,
            this.geoAddressDetails.street, this.geoAddressDetails.building, this.geoAddressDetails.flat,
            this.geoAddressDetails.city, this.geoAddressDetails.zip.asString(), this.geoAddressDetails.locale,
            this.useTypesAsStringSet());
    }

    toAddressDefinitionSucceededEvent(): GeoAddressDefined {
        return new GeoAddressDefined(this.id().asString(), this.partyId().asString(), this.geoAddressDetails.name,
            this.geoAddressDetails.street, this.geoAddressDetails.building, this.geoAddressDetails.flat,
            this.geoAddressDetails.city, this.geoAddressDetails.zip.asString(), this.geoAddressDetails.locale,
            this.useTypesAsStringSet());
    }

    toAddressRemovalSucceededEvent(): GeoAddressRemoved {
        return new GeoAddressRemoved(this.id().asString(), this.partyId().asString());
    }

    private useTypesAsStringSet(): Set<string> {
        const result = new Set<string>();
        this.useTypes().forEach(ut => result.add(ut));
        return result;
    }
}
