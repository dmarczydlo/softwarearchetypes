import { Result, ResultFactory } from '@softwarearchetypes/common';
import { Quantity, Unit, Money } from '@softwarearchetypes/quantity';
import { AddOrderLineCommand } from './commands/add-order-line-command.js';
import { CancelOrderCommand } from './commands/cancel-order-command.js';
import { ChangeOrderLineQuantityCommand } from './commands/change-order-line-quantity-command.js';
import { ConfirmOrderCommand } from './commands/confirm-order-command.js';
import { CreateOrderCommand, OrderPartyData } from './commands/create-order-command.js';
import { PriceOrderCommand } from './commands/price-order-command.js';
import { RemoveOrderLineCommand } from './commands/remove-order-line-command.js';
import { SetArbitraryLinePriceCommand } from './commands/set-arbitrary-line-price-command.js';
import { FulfillmentUpdated } from './fulfillment-updated.js';
import { Order } from './order.js';
import { OrderFactory } from './order-factory.js';
import { OrderId } from './order-id.js';
import { OrderLine } from './order-line.js';
import { OrderLineId } from './order-line-id.js';
import { OrderLineSpecification } from './order-line-specification.js';
import { OrderParties } from './order-parties.js';
import { OrderRepository } from './order-repository.js';
import { OrderView } from './order-view.js';
import { PartyId } from './party-id.js';
import { PartyInOrder } from './party-in-order.js';
import { PartySnapshot } from './party-snapshot.js';
import { ProductIdentifier } from './product-identifier.js';
import { RoleInOrder } from './role-in-order.js';

export class OrderingFacade {
    private readonly orderRepository: OrderRepository;
    private readonly orderFactory: OrderFactory;

    constructor(orderRepository: OrderRepository, orderFactory: OrderFactory) {
        this.orderRepository = orderRepository;
        this.orderFactory = orderFactory;
    }

    handleCreateOrder(command: CreateOrderCommand): Result<string, OrderView> {
        try {
            const orderParties = this.toOrderParties(command.parties);

            const builder = this.orderFactory.newOrder(OrderId.generate(), orderParties);
            for (const lineData of command.lines) {
                builder.addLine(line => {
                    let lb = line
                        .productId(ProductIdentifier.of(lineData.productId))
                        .quantity(Quantity.of(lineData.quantity, Unit.of(lineData.unit, lineData.unit)));
                    if (lineData.specification != null && lineData.specification.size > 0) {
                        lb.specification(OrderLineSpecification.of(lineData.specification));
                    }
                    if (lineData.parties != null && lineData.parties.length > 0) {
                        lb.parties(this.toOrderLineParties(lineData.parties));
                    }
                    return lb;
                });
            }

            const order = builder.build();
            this.orderRepository.save(order);
            return ResultFactory.success<string, OrderView>(OrderView.from(order));
        } catch (e) {
            return ResultFactory.failure<string, OrderView>((e as Error).message);
        }
    }

    handleAddOrderLine(command: AddOrderLineCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order => {
            const line = new OrderLine(
                OrderLineId.generate(),
                ProductIdentifier.of(command.productId),
                Quantity.of(command.quantity, Unit.of(command.unit, command.unit)),
                command.specification.size > 0
                    ? OrderLineSpecification.of(command.specification)
                    : OrderLineSpecification.empty(),
                null
            );
            order.addLine(line);
        });
    }

    handleRemoveOrderLine(command: RemoveOrderLineCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order =>
            order.removeLine(command.lineId));
    }

    handleChangeOrderLineQuantity(command: ChangeOrderLineQuantityCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order =>
            order.changeLineQuantity(command.lineId,
                Quantity.of(command.newQuantity, Unit.of(command.unit, command.unit))));
    }

    handlePriceOrder(command: PriceOrderCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order => order.priceLines());
    }

    handleSetArbitraryLinePrice(command: SetArbitraryLinePriceCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order =>
            order.applyArbitraryPrice(
                command.lineId,
                Money.of(command.unitPrice, command.currency),
                Money.of(command.totalPrice, command.currency),
                command.reason));
    }

    handleConfirmOrder(command: ConfirmOrderCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order => order.confirm());
    }

    handleCancelOrder(command: CancelOrderCommand): Result<string, OrderView> {
        return this.findAndModify(command.orderId, order => order.cancel());
    }

    handleFulfillmentUpdated(event: FulfillmentUpdated): Result<string, OrderView> {
        return this.findAndModify(event.orderId, order =>
            order.updateFulfillmentStatus(event.status));
    }

    private findAndModify(orderId: OrderId, modification: (order: Order) => void): Result<string, OrderView> {
        try {
            const order = this.orderRepository.findById(orderId);
            if (!order) {
                throw new Error("Order not found: " + orderId);
            }
            modification(order);
            this.orderRepository.save(order);
            return ResultFactory.success<string, OrderView>(OrderView.from(order));
        } catch (e) {
            return ResultFactory.failure<string, OrderView>((e as Error).message);
        }
    }

    private toOrderParties(partyDataList: OrderPartyData[]): OrderParties {
        const parties = partyDataList.map(pd => this.toPartyInOrder(pd));
        return OrderParties.forOrder(parties);
    }

    private toOrderLineParties(partyDataList: OrderPartyData[]): OrderParties {
        const parties = partyDataList.map(pd => this.toPartyInOrder(pd));
        return OrderParties.forOrderLine(parties);
    }

    private toPartyInOrder(data: OrderPartyData): PartyInOrder {
        const snapshot = PartySnapshot.of(
            PartyId.of(data.partyId),
            data.name,
            data.contactInfo
        );
        const roles = new Set<RoleInOrder>();
        for (const roleName of data.roles) {
            roles.add(roleName as RoleInOrder);
        }
        return PartyInOrder.ofSet(snapshot, roles);
    }
}
