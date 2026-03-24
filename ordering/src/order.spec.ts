import { describe, it, expect } from 'vitest';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { Order } from './order.js';
import { OrderId } from './order-id.js';
import { OrderLine } from './order-line.js';
import { OrderLineId } from './order-line-id.js';
import { OrderLineSpecification } from './order-line-specification.js';
import { OrderParties } from './order-parties.js';
import { OrderServices } from './order-services.js';
import { OrderStatus } from './order-status.js';
import { PartyId } from './party-id.js';
import { PartySnapshot } from './party-snapshot.js';
import { ProductIdentifier } from './product-identifier.js';
import { RoleInOrder } from './role-in-order.js';
import { FulfillmentStatus } from './fulfillment-status.js';
import { FixableInventoryService, AllocationStatus } from './inventory-service.js';
import { FixablePaymentService } from './payment-service.js';
import { FixableFulfillmentService } from './fulfillment-service.js';
import { FixablePricingService } from './pricing-service.js';

describe('Order', () => {
    const inventoryService = new FixableInventoryService();
    const paymentService = new FixablePaymentService();
    const fulfillmentService = new FixableFulfillmentService();
    const pricingService = new FixablePricingService();
    const services = new OrderServices(pricingService, inventoryService, paymentService, fulfillmentService);

    it('should create order with single line', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-123"), "John Doe", "john@example.com"),
                PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("APPLE-IPHONE-15-PRO"))
            .quantity(Quantity.of(1, Unit.pieces()))
            .specification(spec => spec
                .add("color", "titanium-blue")
                .add("storage", "256GB")
            )
        )
        .build();

        expect(order.status()).toBe(OrderStatus.DRAFT);
        expect(order.lines()).toHaveLength(1);

        const line = order.lines()[0];
        expect(line.productId().value).toBe("APPLE-IPHONE-15-PRO");
        expect(line.quantity().equals(Quantity.of(1, Unit.pieces()))).toBe(true);
        expect(line.specification().get("color")).toBe("titanium-blue");
        expect(line.specification().get("storage")).toBe("256GB");
    });

    it('should create order with multiple lines', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-456"), "Jane Smith", "jane@example.com"),
                PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("LAPTOP-DELL-5540"))
            .quantity(Quantity.of(1, Unit.pieces()))
            .specification(spec => spec
                .add("color", "black")
                .add("ram", "16GB")
            )
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("MOUSE-LOGITECH-MX3"))
            .quantity(Quantity.of(1, Unit.pieces()))
        )
        .build();

        expect(order.lines()).toHaveLength(2);
    });

    it('should create order with package components', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-789"), "Tech Corp", "tech@corp.com"),
                PartySnapshot.of(PartyId.of("it-supplier"), "IT Supplier Inc", "supplier@it.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("PACKAGE-HOME-OFFICE"))
            .quantity(Quantity.of(1, Unit.packages()))
            .specification(spec => spec
                .component("laptop", "Dell-5540")
                .component("mouse", "Logitech-MX3")
                .component("bag", "Targus-15")
                .componentFeature("laptop", "color", "black")
                .componentFeature("laptop", "ram", "16GB")
            )
        )
        .build();

        const line = order.lines()[0];
        expect(line.specification().components().get("laptop")).toBe("Dell-5540");
        expect(line.specification().components().get("mouse")).toBe("Logitech-MX3");
        expect(line.specification().components().get("bag")).toBe("Targus-15");
    });

    it('should create order with preferences', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-123"), "John Doe", "john@example.com"),
                PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("APPLE-IPHONE-15-PRO"))
            .quantity(Quantity.of(1, Unit.pieces()))
            .specification(spec => spec
                .add("color", "blue")
                .preference("warehouse", "warsaw-central")
                .preference("deliveryDate", "2025-01-16")
                .preference("giftWrap", "true")
            )
        )
        .build();

        const line = order.lines()[0];
        expect(line.specification().preferences().get("warehouse")).toBe("warsaw-central");
        expect(line.specification().preferences().get("deliveryDate")).toBe("2025-01-16");
        expect(line.specification().preferences().get("giftWrap")).toBe("true");
    });

    it('should create order with concrete instance reference', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-123"), "BMW Buyer", "buyer@example.com"),
                PartySnapshot.of(PartyId.of("car-dealer"), "Premium Cars Dealer", "dealer@cars.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("BMW-X5-2024"))
            .quantity(Quantity.of(1, Unit.pieces()))
            .specification(spec => spec
                .add("vin", "WBA12345678901234")
            )
        )
        .build();

        const line = order.lines()[0];
        expect(line.specification().get("vin")).toBe("WBA12345678901234");
    });

    it('should create order with temporal resource', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("patient-789"), "Patient Mike", "mike@example.com"),
                PartySnapshot.of(PartyId.of("clinic-orthopedic"), "Orthopedic Clinic", "clinic@ortho.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("SERVICE-ORTHO-CONSULTATION"))
            .quantity(Quantity.of(1, Unit.pieces()))
            .specification(spec => spec
                .add("resourceId", "dr-smith")
                .add("timeSlot", "2025-01-15T10:00/PT30M")
                .add("location", "clinic-room-3")
            )
        )
        .build();

        const line = order.lines()[0];
        expect(line.specification().get("resourceId")).toBe("dr-smith");
        expect(line.specification().get("timeSlot")).toBe("2025-01-15T10:00/PT30M");
    });

    it('should create order for on-demand product', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-123"), "Account Holder", "holder@example.com"),
                PartySnapshot.of(PartyId.of("bank-abc"), "ABC Bank", "bank@abc.com")
            ),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("ACCOUNT-PERSONAL-STANDARD"))
            .quantity(Quantity.of(1, Unit.accounts()))
            .specification(spec => spec
                .add("currency", "PLN")
                .add("package", "standard")
                .add("initialDeposit", "500.00")
                .add("branch", "warsaw-center")
            )
        )
        .build();

        const line = order.lines()[0];
        expect(line.specification().features().get("currency")).toBe("PLN");
        expect(line.specification().features().get("package")).toBe("standard");
    });

    it('should use shorthand for simple order', () => {
        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("workshop-123"), "Workshop ABC", "workshop@abc.com"),
                PartySnapshot.of(PartyId.of("hardware-supplier"), "Hardware Supplier Co", "supplier@hardware.com")
            ),
            services
        )
        .addLine(
            ProductIdentifier.of("SCREW-M6-50MM"),
            Quantity.of(5000, Unit.pieces())
        )
        .build();

        expect(order.lines()).toHaveLength(1);
        const line = order.lines()[0];
        expect(line.specification().attributes().size).toBe(0);
    });

    it('should throw when order has no lines', () => {
        expect(() =>
            Order.builder(
                OrderId.generate(),
                OrderParties.singleParty(
                    PartySnapshot.of(PartyId.of("customer-123"), "John Doe", "john@example.com"),
                    PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com")
                ),
                services
            ).build()
        ).toThrow();
    });

    it('should create order with line level parties', () => {
        const customer = PartySnapshot.of(PartyId.of("customer-123"), "John Doe", "john@example.com");
        const shop = PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com");
        const branchParty = PartySnapshot.of(PartyId.of("branch-cracow"), "Cracow Branch", "cracow@shop.com");
        const courierParty = PartySnapshot.of(PartyId.of("courier-1"), "Courier Bob", "bob@courier.com");

        const order = Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(customer, shop),
            services
        )
        .addLine(line => line
            .productId(ProductIdentifier.of("LAPTOP-DELL-5540"))
            .quantity(Quantity.of(1, Unit.pieces()))
            .specification(spec => spec.add("color", "black"))
            .parties(parties => parties
                .receiver(branchParty)
                .deliveryContact(courierParty)
            )
        )
        .build();

        expect(order.lines()).toHaveLength(1);
        const line = order.lines()[0];
        expect(line.hasLineLevelParties()).toBe(true);

        const effectiveParties = order.getEffectivePartiesFor(line);
        expect(effectiveParties.partyWithRole(RoleInOrder.ORDERER).partyId().value).toBe(customer.partyId.value);
        expect(effectiveParties.partyWithRole(RoleInOrder.PAYER).partyId().value).toBe(customer.partyId.value);
        expect(effectiveParties.partyWithRole(RoleInOrder.EXECUTOR).partyId().value).toBe(shop.partyId.value);
        expect(effectiveParties.partyWithRole(RoleInOrder.RECEIVER).partyId().value).toBe(branchParty.partyId.value);
        expect(effectiveParties.partyWithRole(RoleInOrder.DELIVERY_CONTACT).partyId().value).toBe(courierParty.partyId.value);
    });

    // --- Behavioral tests for Order aggregate ---

    it('should add line to order', () => {
        const order = draftOrderWithOneLine();

        order.addLine(new OrderLine(
            OrderLineId.generate(),
            ProductIdentifier.of("MOUSE-LOGITECH-MX3"),
            Quantity.of(2, Unit.pieces()),
            OrderLineSpecification.empty(),
            null
        ));

        expect(order.lines()).toHaveLength(2);
    });

    it('should fail to add line to confirmed order', () => {
        const order = draftOrderWithOneLine();
        configureServicesForConfirm();
        order.confirm();

        expect(() =>
            order.addLine(new OrderLine(
                OrderLineId.generate(),
                ProductIdentifier.of("MOUSE"),
                Quantity.of(1, Unit.pieces()),
                OrderLineSpecification.empty(),
                null
            ))
        ).toThrow();
    });

    it('should remove line from order', () => {
        const order = draftOrderWithTwoLines();
        const secondLineId = order.lines()[1].id();

        order.removeLine(secondLineId);

        expect(order.lines()).toHaveLength(1);
    });

    it('should fail to remove last line', () => {
        const order = draftOrderWithOneLine();
        const lineId = order.lines()[0].id();

        expect(() => order.removeLine(lineId)).toThrow();
    });

    it('should remove line from confirmed order', () => {
        const order = draftOrderWithTwoLines();
        configureServicesForConfirm();
        order.confirm();
        const lineId = order.lines()[0].id();

        order.removeLine(lineId);

        expect(order.lines()).toHaveLength(1);
    });

    it('should change line quantity', () => {
        const order = draftOrderWithOneLine();
        const lineId = order.lines()[0].id();

        order.changeLineQuantity(lineId, Quantity.of(500, Unit.pieces()));

        expect(order.lines()[0].quantity().equals(Quantity.of(500, Unit.pieces()))).toBe(true);
    });

    it('should fail to change quantity on non-existent line', () => {
        const order = draftOrderWithOneLine();

        expect(() =>
            order.changeLineQuantity(OrderLineId.generate(), Quantity.of(10, Unit.pieces()))
        ).toThrow();
    });

    it('should confirm draft order', () => {
        const order = draftOrderWithOneLine();
        configureServicesForConfirm();

        order.confirm();

        expect(order.status()).toBe(OrderStatus.CONFIRMED);
    });

    it('should fail to confirm non-draft order', () => {
        const order = draftOrderWithOneLine();
        configureServicesForConfirm();
        order.confirm();

        expect(() => order.confirm()).toThrow();
    });

    it('should cancel draft order', () => {
        const order = draftOrderWithOneLine();

        order.cancel();

        expect(order.status()).toBe(OrderStatus.CANCELLED);
    });

    it('should cancel confirmed order', () => {
        const order = draftOrderWithOneLine();
        configureServicesForConfirm();
        order.confirm();

        order.cancel();

        expect(order.status()).toBe(OrderStatus.CANCELLED);
    });

    it('should fail to cancel already cancelled order', () => {
        const order = draftOrderWithOneLine();
        order.cancel();

        expect(() => order.cancel()).toThrow();
    });

    it('should update fulfillment status to processing', () => {
        const order = draftOrderWithOneLine();
        configureServicesForConfirm();
        order.confirm();

        order.updateFulfillmentStatus(FulfillmentStatus.IN_PROGRESS);

        expect(order.status()).toBe(OrderStatus.PROCESSING);
    });

    it('should update fulfillment status to fulfilled', () => {
        const order = draftOrderWithOneLine();
        configureServicesForConfirm();
        order.confirm();

        order.updateFulfillmentStatus(FulfillmentStatus.COMPLETED);

        expect(order.status()).toBe(OrderStatus.FULFILLED);
    });

    it('should fail to update fulfillment on draft order', () => {
        const order = draftOrderWithOneLine();

        expect(() =>
            order.updateFulfillmentStatus(FulfillmentStatus.IN_PROGRESS)
        ).toThrow();
    });

    // --- Helper methods ---

    function configureServicesForConfirm(): void {
        inventoryService.willReturnOnAllocate(AllocationStatus.ALLOCATED);
    }

    function draftOrderWithOneLine(): Order {
        return Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-123"), "John Doe", "john@example.com"),
                PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com")
            ),
            services
        )
        .addLine(ProductIdentifier.of("LAPTOP-DELL-5540"), Quantity.of(1, Unit.pieces()))
        .build();
    }

    function draftOrderWithTwoLines(): Order {
        return Order.builder(
            OrderId.generate(),
            OrderParties.singleParty(
                PartySnapshot.of(PartyId.of("customer-123"), "John Doe", "john@example.com"),
                PartySnapshot.of(PartyId.of("shop-warsaw"), "Warsaw Shop", "warsaw@shop.com")
            ),
            services
        )
        .addLine(ProductIdentifier.of("LAPTOP-DELL-5540"), Quantity.of(1, Unit.pieces()))
        .addLine(ProductIdentifier.of("MOUSE-LOGITECH-MX3"), Quantity.of(2, Unit.pieces()))
        .build();
    }
});
