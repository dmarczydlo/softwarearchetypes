import { Preconditions } from '@softwarearchetypes/common';
import { Quantity } from '@softwarearchetypes/quantity';
import { randomUUID } from 'crypto';
import { OrderId } from './order-id.js';
import { OrderLineId } from './order-line-id.js';
import { ProductIdentifier } from './product-identifier.js';

export enum AllocationPolicy {
    REJECT = "REJECT",
    RESERVE_TIMEOUT = "RESERVE_TIMEOUT",
    WAITLIST = "WAITLIST",
    POLL_RETRY = "POLL_RETRY",
    ELASTIC = "ELASTIC"
}

export enum AllocationStatus {
    ALLOCATED = "ALLOCATED",
    WAITLISTED = "WAITLISTED",
    PARTIAL = "PARTIAL",
    UNAVAILABLE = "UNAVAILABLE"
}

export enum AllocationStrategy {
    NONE = "NONE",
    PRE_ALLOCATED = "PRE_ALLOCATED",
    ORDER_DRIVEN = "ORDER_DRIVEN",
    EXTERNAL = "EXTERNAL"
}

export class BlockadeId {
    readonly value: string;
    constructor(value: string) { this.value = value; }
    static of(value: string): BlockadeId { return new BlockadeId(value); }
    toString(): string { return this.value; }
}

export class ReservationId {
    readonly value: string;
    constructor(value: string) { this.value = value; }
    static of(value: string): ReservationId { return new ReservationId(value); }
    static generate(): ReservationId { return new ReservationId(randomUUID()); }
    toString(): string { return this.value; }
}

export class ResourceId {
    readonly value: string;
    constructor(value: string) { this.value = value; }
    static of(value: string): ResourceId { return new ResourceId(value); }
    toString(): string { return this.value; }
}

export class WaitlistId {
    readonly value: string;
    constructor(value: string) { this.value = value; }
    static of(value: string): WaitlistId { return new WaitlistId(value); }
    static generate(): WaitlistId { return new WaitlistId(randomUUID()); }
}

export class Reservation {
    readonly id: ReservationId;
    readonly orderId: OrderId;
    readonly orderLineId: OrderLineId;
    readonly blockadeId: BlockadeId;
    readonly resourceId: ResourceId;

    constructor(id: ReservationId, orderId: OrderId, orderLineId: OrderLineId, blockadeId: BlockadeId, resourceId: ResourceId) {
        Preconditions.checkArgument(id != null, "ReservationId must be defined");
        Preconditions.checkArgument(orderId != null, "OrderId must be defined");
        Preconditions.checkArgument(orderLineId != null, "OrderLineId must be defined");
        Preconditions.checkArgument(blockadeId != null, "BlockadeId must be defined");
        Preconditions.checkArgument(resourceId != null, "ResourceId must be defined");
        this.id = id;
        this.orderId = orderId;
        this.orderLineId = orderLineId;
        this.blockadeId = blockadeId;
        this.resourceId = resourceId;
    }
}

export class AllocationRequest {
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly orderId: OrderId;
    readonly policy: AllocationPolicy | null;
    readonly context: Map<string, string> | null;

    constructor(productId: ProductIdentifier, quantity: Quantity, orderId: OrderId,
                policy: AllocationPolicy | null = null, context: Map<string, string> | null = null) {
        this.productId = productId;
        this.quantity = quantity;
        this.orderId = orderId;
        this.policy = policy;
        this.context = context;
    }

    static builder(): AllocationRequestBuilder {
        return new AllocationRequestBuilder();
    }
}

export class AllocationRequestBuilder {
    private _productId!: ProductIdentifier;
    private _quantity!: Quantity;
    private _orderId!: OrderId;
    private _policy: AllocationPolicy | null = null;
    private _context: Map<string, string> | null = null;

    productId(productId: ProductIdentifier): this { this._productId = productId; return this; }
    quantity(quantity: Quantity): this { this._quantity = quantity; return this; }
    orderId(orderId: OrderId): this { this._orderId = orderId; return this; }
    policy(policy: AllocationPolicy): this { this._policy = policy; return this; }
    context(context: Map<string, string>): this { this._context = context; return this; }

    build(): AllocationRequest {
        return new AllocationRequest(this._productId, this._quantity, this._orderId, this._policy, this._context);
    }
}

export class AllocationResult {
    readonly status: AllocationStatus;
    readonly reservationId: ReservationId | null;
    readonly attributes: Map<string, string>;

    constructor(status: AllocationStatus, reservationId: ReservationId | null = null,
                attributes: Map<string, string> = new Map()) {
        this.status = status;
        this.reservationId = reservationId;
        this.attributes = attributes;
    }

    static builder(): AllocationResultBuilder {
        return new AllocationResultBuilder();
    }
}

export class AllocationResultBuilder {
    private _status!: AllocationStatus;
    private _reservationId: ReservationId | null = null;
    private _attributes: Map<string, string> = new Map();

    status(status: AllocationStatus): this { this._status = status; return this; }
    reservationId(reservationId: ReservationId): this { this._reservationId = reservationId; return this; }
    attributes(attributes: Map<string, string>): this { this._attributes = attributes; return this; }

    build(): AllocationResult {
        return new AllocationResult(this._status, this._reservationId, this._attributes);
    }
}

export class AvailabilityQuery {
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly context: Map<string, string>;

    constructor(productId: ProductIdentifier, quantity: Quantity, context: Map<string, string> = new Map()) {
        this.productId = productId;
        this.quantity = quantity;
        this.context = context;
    }

    static builder(): AvailabilityQueryBuilder {
        return new AvailabilityQueryBuilder();
    }
}

export class AvailabilityQueryBuilder {
    private _productId!: ProductIdentifier;
    private _quantity!: Quantity;
    private _context: Map<string, string> = new Map();

    productId(productId: ProductIdentifier): this { this._productId = productId; return this; }
    quantity(quantity: Quantity): this { this._quantity = quantity; return this; }
    context(context: Map<string, string>): this { this._context = context; return this; }

    build(): AvailabilityQuery {
        return new AvailabilityQuery(this._productId, this._quantity, this._context);
    }
}

export class AvailabilityResult {
    readonly available: boolean;
    readonly availableQuantity: Quantity | null;
    readonly attributes: Map<string, string>;

    constructor(available: boolean, availableQuantity: Quantity | null, attributes: Map<string, string> = new Map()) {
        this.available = available;
        this.availableQuantity = availableQuantity;
        this.attributes = attributes;
    }

    static available(quantity: Quantity): AvailabilityResult {
        return new AvailabilityResult(true, quantity, new Map());
    }

    static unavailable(): AvailabilityResult {
        return new AvailabilityResult(false, null, new Map());
    }

    static partial(availableQuantity: Quantity): AvailabilityResult {
        return new AvailabilityResult(false, availableQuantity, new Map([["status", "partial"]]));
    }
}

export class ReservationRequest {
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly timeout: number; // milliseconds
    readonly context: Map<string, string>;

    constructor(productId: ProductIdentifier, quantity: Quantity, timeout: number = 0,
                context: Map<string, string> = new Map()) {
        this.productId = productId;
        this.quantity = quantity;
        this.timeout = timeout;
        this.context = context;
    }

    static builder(): ReservationRequestBuilder {
        return new ReservationRequestBuilder();
    }
}

export class ReservationRequestBuilder {
    private _productId!: ProductIdentifier;
    private _quantity!: Quantity;
    private _timeout = 0;
    private _context: Map<string, string> = new Map();

    productId(productId: ProductIdentifier): this { this._productId = productId; return this; }
    quantity(quantity: Quantity): this { this._quantity = quantity; return this; }
    timeout(timeout: number): this { this._timeout = timeout; return this; }
    context(context: Map<string, string>): this { this._context = context; return this; }

    build(): ReservationRequest {
        return new ReservationRequest(this._productId, this._quantity, this._timeout, this._context);
    }
}

export class ReservationResponse {
    readonly id: ReservationId;
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly expiresAt: Date;
    readonly attributes: Map<string, string>;

    constructor(id: ReservationId, productId: ProductIdentifier, quantity: Quantity,
                expiresAt: Date, attributes: Map<string, string> = new Map()) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
        this.expiresAt = expiresAt;
        this.attributes = attributes;
    }

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
}

export interface InventoryService {
    checkAvailability(query: AvailabilityQuery): AvailabilityResult;
    reserve(request: ReservationRequest): ReservationResponse;
    allocate(request: AllocationRequest): AllocationResult;
    validateReservation(reservationId: ReservationId, orderId: OrderId): void;
    commitReservation(reservationId: ReservationId, orderId: OrderId): void;
    fulfillFromWaitlist(waitlistId: WaitlistId): void;
}

export class FixableInventoryService implements InventoryService {
    private allocationResult: AllocationResult = FixableInventoryService.defaultAllocated();
    private readonly _allocateRequests: AllocationRequest[] = [];

    willReturnOnAllocate(result: AllocationResult | AllocationStatus): void {
        if (result instanceof AllocationResult) {
            this.allocationResult = result;
        } else {
            this.allocationResult = AllocationResult.builder()
                .status(result)
                .attributes(new Map())
                .build();
        }
    }

    willFailOnAllocate(): void {
        this.allocationResult = AllocationResult.builder()
            .status(AllocationStatus.UNAVAILABLE)
            .attributes(new Map())
            .build();
    }

    reset(): void {
        this.allocationResult = FixableInventoryService.defaultAllocated();
        this._allocateRequests.length = 0;
    }

    allocateRequests(): AllocationRequest[] {
        return [...this._allocateRequests];
    }

    checkAvailability(query: AvailabilityQuery): AvailabilityResult {
        return AvailabilityResult.available(query.quantity);
    }

    reserve(request: ReservationRequest): ReservationResponse {
        return new ReservationResponse(
            ReservationId.generate(),
            request.productId,
            request.quantity,
            new Date(Date.now() + 3600000),
            new Map()
        );
    }

    allocate(request: AllocationRequest): AllocationResult {
        this._allocateRequests.push(request);
        return this.allocationResult;
    }

    validateReservation(_reservationId: ReservationId, _orderId: OrderId): void {}
    commitReservation(_reservationId: ReservationId, _orderId: OrderId): void {}
    fulfillFromWaitlist(_waitlistId: WaitlistId): void {}

    private static defaultAllocated(): AllocationResult {
        return AllocationResult.builder()
            .status(AllocationStatus.ALLOCATED)
            .reservationId(ReservationId.generate())
            .attributes(new Map())
            .build();
    }
}
