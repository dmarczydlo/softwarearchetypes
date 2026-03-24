import { Preconditions } from '@softwarearchetypes/common';
import { Money, Quantity } from '@softwarearchetypes/quantity';
import { FulfillmentStatus } from './fulfillment-status.js';
import { AllocationRequest, AllocationStatus, Reservation } from './inventory-service.js';
import { OrderId } from './order-id.js';
import { OrderLine } from './order-line.js';
import { OrderLineId } from './order-line-id.js';
import { ArbitraryPricing, OrderLinePricing } from './order-line-pricing.js';
import { OrderLineSpecification } from './order-line-specification.js';
import { OrderParties } from './order-parties.js';
import { OrderServices } from './order-services.js';
import { OrderStatus, canAddLines, canModifyLines, canCancel } from './order-status.js';
import { PartyInOrder } from './party-in-order.js';
import { PartySnapshot } from './party-snapshot.js';
import { PaymentRequest, PaymentStatus } from './payment-service.js';
import { PricingContext } from './pricing-service.js';
import { ProductIdentifier } from './product-identifier.js';
import { RoleInOrder } from './role-in-order.js';

/** @internal */
export function createOrder(
    id: OrderId,
    status: OrderStatus,
    lines: OrderLine[],
    parties: OrderParties,
    services: OrderServices
): Order {
    return new Order(id, status, lines, parties, services);
}

export class Order {
    private readonly _id: OrderId;
    private _status: OrderStatus;
    private readonly _lines: OrderLine[];
    private readonly _parties: OrderParties;
    private readonly _reservations: Reservation[];
    private readonly _services: OrderServices;

    /** @internal - use Order.builder() instead */
    constructor(
        id: OrderId,
        status: OrderStatus,
        lines: OrderLine[],
        parties: OrderParties,
        services: OrderServices
    ) {
        Preconditions.checkArgument(id != null, "OrderId must be defined");
        Preconditions.checkArgument(status != null, "OrderStatus must be defined");
        Preconditions.checkArgument(lines != null, "Lines must be defined");
        Preconditions.checkArgument(parties != null, "OrderParties must be defined");
        Preconditions.checkArgument(services != null, "OrderServices must be defined");

        this._id = id;
        this._status = status;
        this._lines = [...lines];
        this._parties = parties;
        this._reservations = [];
        this._services = services;
    }

    id(): OrderId {
        return this._id;
    }

    status(): OrderStatus {
        return this._status;
    }

    lines(): OrderLine[] {
        return [...this._lines];
    }

    parties(): OrderParties {
        return this._parties;
    }

    reservations(): Reservation[] {
        return [...this._reservations];
    }

    getEffectivePartiesFor(line: OrderLine): OrderParties {
        if (line.parties().isEmpty()) {
            return this._parties;
        }
        return OrderParties.merge(this._parties, line.parties());
    }

    addLine(line: OrderLine): void {
        Preconditions.checkState(canAddLines(this._status), "Cannot add lines in status: " + this._status);
        Preconditions.checkArgument(line != null, "OrderLine must be defined");
        this._lines.push(line);
    }

    removeLine(lineId: OrderLineId): void {
        Preconditions.checkState(canModifyLines(this._status), "Cannot remove lines in status: " + this._status);
        Preconditions.checkArgument(lineId != null, "OrderLineId must be defined");
        const idx = this._lines.findIndex(l => l.id().equals(lineId));
        Preconditions.checkState(idx >= 0, "Order line not found: " + lineId);
        this._lines.splice(idx, 1);
        Preconditions.checkState(this._lines.length > 0, "Order must have at least one line");
    }

    changeLineQuantity(lineId: OrderLineId, newQuantity: Quantity): void {
        Preconditions.checkState(canModifyLines(this._status), "Cannot modify lines in status: " + this._status);
        Preconditions.checkArgument(lineId != null, "OrderLineId must be defined");
        Preconditions.checkArgument(newQuantity != null, "Quantity must be defined");
        const idx = this._lines.findIndex(l => l.id().equals(lineId));
        if (idx < 0) {
            throw new Error("Order line not found: " + lineId);
        }
        const existing = this._lines[idx];
        this._lines[idx] = new OrderLine(
            existing.id(), existing.productId(), newQuantity,
            existing.specification(), existing.parties()
        );
    }

    priceLines(): void {
        for (const line of this._lines) {
            const effectiveParties = this.getEffectivePartiesFor(line);
            const context = PricingContext.forOrderLine(line, effectiveParties);
            const pricing = this._services.pricing.calculatePrice(context);
            line.applyPricing(pricing);
        }
    }

    applyArbitraryPrice(lineId: OrderLineId, unitPrice: Money, totalPrice: Money, reason: string): void {
        this.applyPricing(lineId, new ArbitraryPricing(unitPrice, totalPrice, reason));
    }

    confirm(): void {
        Preconditions.checkState(this._status === OrderStatus.DRAFT, "Only DRAFT orders can be confirmed");

        for (const line of this._lines) {
            const result = this._services.inventory.allocate(
                AllocationRequest.builder()
                    .productId(line.productId())
                    .quantity(line.quantity())
                    .orderId(this._id)
                    .build()
            );
            if (result.status !== AllocationStatus.ALLOCATED) {
                throw new Error("Inventory allocation failed for product: "
                    + line.productId() + ", status: " + result.status);
            }
        }

        const paymentResult = this._services.payment.authorizeAndCapture(
            PaymentRequest.builder()
                .orderId(this._id)
                .amount(this.totalPrice() ?? Money.of(0, "PLN"))
                .build()
        );
        if (paymentResult.status !== PaymentStatus.CAPTURED) {
            throw new Error("Payment failed: " + paymentResult.failureReason);
        }

        this._status = OrderStatus.CONFIRMED;
        this._services.fulfillment.startFulfillment(this._id);
    }

    cancel(): void {
        Preconditions.checkState(canCancel(this._status), "Cannot cancel order in status: " + this._status);
        const previousStatus = this._status;
        this._status = OrderStatus.CANCELLED;
        if (previousStatus !== OrderStatus.DRAFT) {
            this._services.fulfillment.cancelFulfillment(this._id);
        }
    }

    updateFulfillmentStatus(fulfillmentStatus: FulfillmentStatus): void {
        Preconditions.checkState(
            this._status === OrderStatus.CONFIRMED || this._status === OrderStatus.PROCESSING,
            "Cannot update fulfillment in status: " + this._status
        );
        if (fulfillmentStatus === FulfillmentStatus.IN_PROGRESS || fulfillmentStatus === FulfillmentStatus.PARTIALLY_COMPLETED) {
            this._status = OrderStatus.PROCESSING;
        } else if (fulfillmentStatus === FulfillmentStatus.COMPLETED) {
            this._status = OrderStatus.FULFILLED;
        }
    }

    isFullyPriced(): boolean {
        return this._lines.every(l => l.isPriced());
    }

    hasAllDefinitivePrices(): boolean {
        return this._lines.every(l => l.hasDefinitivePrice());
    }

    totalPrice(): Money | null {
        if (!this.isFullyPriced()) {
            return null;
        }
        if (this._lines.length === 0) {
            return Money.of(0, "PLN");
        }
        let total = this._lines[0].pricing().totalPrice();
        for (let i = 1; i < this._lines.length; i++) {
            total = total.add(this._lines[i].pricing().totalPrice());
        }
        return total;
    }

    private applyPricing(lineId: OrderLineId, pricing: OrderLinePricing): void {
        Preconditions.checkArgument(lineId != null, "OrderLineId must be defined");
        Preconditions.checkArgument(pricing != null, "Pricing must be defined");
        const line = this._lines.find(l => l.id().equals(lineId));
        if (!line) {
            throw new Error("Order line not found: " + lineId);
        }
        line.applyPricing(pricing);
    }

    static builder(id: OrderId, parties: OrderParties, services: OrderServices): OrderBuilder {
        return new OrderBuilder(id, parties, services);
    }

    toString(): string {
        return `Order{id=${this._id}, status=${this._status}, lines=${this._lines.length}, parties=${this._parties}}`;
    }
}

export class OrderBuilder {
    private readonly _id: OrderId;
    private readonly _parties: OrderParties;
    private readonly _services: OrderServices;
    private readonly _lines: OrderLine[] = [];

    constructor(id: OrderId, parties: OrderParties, services: OrderServices) {
        this._id = id;
        this._parties = parties;
        this._services = services;
    }

    addLine(lineConfig: (lb: LineBuilder) => LineBuilder): OrderBuilder;
    addLine(productId: ProductIdentifier, quantity: Quantity): OrderBuilder;
    addLine(productId: ProductIdentifier, quantity: Quantity, specification: OrderLineSpecification): OrderBuilder;
    addLine(
        productIdOrConfig: ProductIdentifier | ((lb: LineBuilder) => LineBuilder),
        quantity?: Quantity,
        specification?: OrderLineSpecification
    ): OrderBuilder {
        if (typeof productIdOrConfig === 'function') {
            const line = productIdOrConfig(new LineBuilder()).build();
            this._lines.push(line);
        } else {
            const lb = new LineBuilder()
                .productId(productIdOrConfig)
                .quantity(quantity!);
            if (specification) {
                lb.specification(specification);
            }
            this._lines.push(lb.build());
        }
        return this;
    }

    build(): Order {
        Preconditions.checkState(this._lines.length > 0, "Order must have at least one line");
        return new Order(this._id, OrderStatus.DRAFT, this._lines, this._parties, this._services);
    }
}

export class LineBuilder {
    private _productId!: ProductIdentifier;
    private _quantity!: Quantity;
    private _specification: OrderLineSpecification = OrderLineSpecification.empty();
    private _parties: OrderParties | null = null;

    productId(productId: ProductIdentifier): this {
        this._productId = productId;
        return this;
    }

    quantity(quantity: Quantity): this {
        this._quantity = quantity;
        return this;
    }

    specification(spec: OrderLineSpecification): this;
    specification(key: string, value: string): this;
    specification(specConfig: (sb: SpecBuilder) => SpecBuilder): this;
    specification(specOrKeyOrConfig: OrderLineSpecification | string | ((sb: SpecBuilder) => SpecBuilder), value?: string): this {
        if (typeof specOrKeyOrConfig === 'function') {
            this._specification = specOrKeyOrConfig(new SpecBuilder()).build();
        } else if (typeof specOrKeyOrConfig === 'string') {
            this._specification = OrderLineSpecification.of(specOrKeyOrConfig, value!);
        } else {
            this._specification = specOrKeyOrConfig;
        }
        return this;
    }

    parties(parties: OrderParties): this;
    parties(partiesConfig: (pb: PartiesBuilder) => PartiesBuilder): this;
    parties(partiesOrConfig: OrderParties | ((pb: PartiesBuilder) => PartiesBuilder)): this {
        if (typeof partiesOrConfig === 'function') {
            this._parties = partiesOrConfig(new PartiesBuilder()).build();
        } else {
            this._parties = partiesOrConfig;
        }
        return this;
    }

    build(): OrderLine {
        Preconditions.checkState(this._productId != null, "ProductId must be defined");
        Preconditions.checkState(this._quantity != null, "Quantity must be defined");
        return new OrderLine(
            OrderLineId.generate(),
            this._productId,
            this._quantity,
            this._specification,
            this._parties
        );
    }
}

export class SpecBuilder {
    private readonly _attributes: Map<string, string> = new Map();

    add(key: string, value: string): this {
        this._attributes.set(key, value);
        return this;
    }

    addAll(attrs: Map<string, string>): this {
        for (const [k, v] of attrs) {
            this._attributes.set(k, v);
        }
        return this;
    }

    component(componentName: string, productId: string): this {
        return this.add("component." + componentName, productId);
    }

    componentFeature(componentName: string, featureName: string, value: string): this {
        return this.add(componentName + "." + featureName, value);
    }

    preference(preferenceName: string, value: string): this {
        return this.add("_" + preferenceName, value);
    }

    build(): OrderLineSpecification {
        return new OrderLineSpecification(this._attributes);
    }
}

export class PartiesBuilder {
    private readonly _parties: PartyInOrder[] = [];

    add(party: PartyInOrder): this {
        this._parties.push(party);
        return this;
    }

    receiver(party: PartySnapshot): this {
        return this.add(PartyInOrder.of(party, RoleInOrder.RECEIVER));
    }

    deliveryContact(party: PartySnapshot): this {
        return this.add(PartyInOrder.of(party, RoleInOrder.DELIVERY_CONTACT));
    }

    pickupAuthorized(party: PartySnapshot): this {
        return this.add(PartyInOrder.of(party, RoleInOrder.PICKUP_AUTHORIZED));
    }

    build(): OrderParties {
        return OrderParties.forOrderLine(this._parties);
    }
}
