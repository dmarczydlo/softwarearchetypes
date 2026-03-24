import { Version } from '@softwarearchetypes/common';
import { BlockadeId } from '../availability/blockade-id';
import { OwnerId } from '../availability/owner-id';
import { ReservationId } from './reservation-id';
import { ReservationPurpose } from './reservation-purpose';
import { ReservationStatus } from './reservation-status';

export class Reservation {
    readonly id: ReservationId;
    private readonly _owner: OwnerId;
    private readonly _purpose: ReservationPurpose;
    private readonly _blockadeIds: BlockadeId[];
    private readonly _createdAt: Date;
    private _status: ReservationStatus;
    private readonly _version: Version;

    constructor(
        id: ReservationId,
        owner: OwnerId,
        purpose: ReservationPurpose,
        blockadeIds: BlockadeId[],
        createdAt: Date,
        status: ReservationStatus,
        version: Version,
    ) {
        if (!id) throw new Error('ReservationId cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!purpose) throw new Error('purpose cannot be null');
        if (!blockadeIds) throw new Error('blockadeIds cannot be null');
        if (!createdAt) throw new Error('createdAt cannot be null');
        if (!status) throw new Error('status cannot be null');
        this.id = id;
        this._owner = owner;
        this._purpose = purpose;
        this._blockadeIds = [...blockadeIds];
        this._createdAt = createdAt;
        this._status = status;
        this._version = version;
    }

    static create(owner: OwnerId, purpose: ReservationPurpose, blockadeIds: BlockadeId[], createdAt: Date): Reservation {
        return new Reservation(
            ReservationId.random(), owner, purpose, blockadeIds, createdAt,
            ReservationStatus.CONFIRMED, Version.initial(),
        );
    }

    owner(): OwnerId { return this._owner; }
    purpose(): ReservationPurpose { return this._purpose; }
    blockadeIds(): BlockadeId[] { return [...this._blockadeIds]; }
    createdAt(): Date { return this._createdAt; }
    status(): ReservationStatus { return this._status; }

    isConfirmed(): boolean { return this._status === ReservationStatus.CONFIRMED; }
    isCancelled(): boolean { return this._status === ReservationStatus.CANCELLED; }
    isActive(): boolean { return this.isConfirmed(); }

    cancel(): void {
        if (!this.isActive()) {
            throw new Error('Can only cancel active reservations');
        }
        this._status = ReservationStatus.CANCELLED;
    }

    version(): Version { return this._version; }
}
