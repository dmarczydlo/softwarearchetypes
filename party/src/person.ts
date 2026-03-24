import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Version } from '@softwarearchetypes/common';
import { Party } from './party.js';
import { PartyId } from './party-id.js';
import { Role } from './role.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import { PersonalData } from './personal-data.js';
import type { PartyRegistered } from './events/party-registered.js';
import { PersonRegistered } from './events/person-registered.js';
import { PersonalDataUpdated } from './events/personal-data-updated.js';
import { PersonalDataUpdateSkipped } from './events/personal-data-update-skipped.js';
import { Preconditions } from '@softwarearchetypes/common';

export class Person extends Party {
    private _personalData: PersonalData;

    constructor(id: PartyId, personalData: PersonalData, roles: Set<Role>, registeredIdentifiers: Set<RegisteredIdentifier>, version: Version) {
        super('PERSON', id, roles, registeredIdentifiers, version);
        Preconditions.checkArgument(personalData != null, 'Personal data cannot be null');
        this._personalData = personalData;
    }

    update(personalData: PersonalData): Result<string, Person> {
        if (this._personalData.firstName !== personalData.firstName || this._personalData.lastName !== personalData.lastName) {
            this._personalData = personalData;
            this.register(new PersonalDataUpdated(this.id().asString(), personalData.firstName, personalData.lastName));
        } else {
            this.register(PersonalDataUpdateSkipped.dueToNoChangeIdentifiedFor(this.id().asString(), personalData.firstName, personalData.lastName));
        }
        return ResultFactory.success(this);
    }

    personalData(): PersonalData { return this._personalData; }

    toPartyRegisteredEvent(): PartyRegistered {
        return new PersonRegistered(
            this.id().asString(), this._personalData.firstName, this._personalData.lastName,
            new Set([...this.registeredIdentifiers()].map(ri => ri.asString())),
            new Set([...this.roles()].map(r => r.asString()))
        );
    }
}
