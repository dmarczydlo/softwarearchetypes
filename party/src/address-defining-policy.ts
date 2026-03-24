import type { Address } from './address.js';
import type { Addresses } from './addresses.js';

export interface AddressDefiningPolicy {
    isAddressDefinitionAllowedFor(addresses: Addresses, address: Address): boolean;
}

export class AlwaysAllowAddressDefiningPolicy implements AddressDefiningPolicy {
    isAddressDefinitionAllowedFor(_addresses: Addresses, _address: Address): boolean {
        return true;
    }
}

export class NoDuplicateAddressesPolicy implements AddressDefiningPolicy {
    isAddressDefinitionAllowedFor(addresses: Addresses, newAddress: Address): boolean {
        for (const addr of addresses.asSet()) {
            if (addr.constructor === newAddress.constructor) {
                if (JSON.stringify(addr.addressDetails()) === JSON.stringify(newAddress.addressDetails())) {
                    return false;
                }
            }
        }
        return true;
    }
}

export class NoOverlappingValidityForSameTypePolicy implements AddressDefiningPolicy {
    isAddressDefinitionAllowedFor(addresses: Addresses, newAddress: Address): boolean {
        for (const addr of addresses.asSet()) {
            if (addr.constructor === newAddress.constructor) {
                const hasCommonUseType = [...addr.useTypes()].some(ut => newAddress.useTypes().has(ut));
                if (hasCommonUseType && addr.validity().overlaps(newAddress.validity())) {
                    return false;
                }
            }
        }
        return true;
    }
}

export class CompositeAddressDefiningPolicy implements AddressDefiningPolicy {
    private readonly policies: AddressDefiningPolicy[];

    constructor(...policies: AddressDefiningPolicy[]) {
        this.policies = policies;
    }

    isAddressDefinitionAllowedFor(addresses: Addresses, address: Address): boolean {
        for (const policy of this.policies) {
            if (!policy.isAddressDefinitionAllowedFor(addresses, address)) return false;
        }
        return true;
    }
}

export const AddressDefiningPolicies = {
    noDuplicateAddresses: () => new NoDuplicateAddressesPolicy(),
    noOverlappingValidityForSameType: () => new NoOverlappingValidityForSameTypePolicy(),
    composite: (...policies: AddressDefiningPolicy[]) => new CompositeAddressDefiningPolicy(...policies),
    all: () => new CompositeAddressDefiningPolicy(new NoDuplicateAddressesPolicy(), new NoOverlappingValidityForSameTypePolicy()),
    alwaysAllow: () => new AlwaysAllowAddressDefiningPolicy(),
    DEFAULT: new CompositeAddressDefiningPolicy(new NoDuplicateAddressesPolicy(), new NoOverlappingValidityForSameTypePolicy())
};
