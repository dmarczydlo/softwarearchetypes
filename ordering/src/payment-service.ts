import { Money } from '@softwarearchetypes/quantity';
import { randomUUID } from 'crypto';
import { OrderId } from './order-id.js';

export enum PaymentStatus {
    CAPTURED = "CAPTURED",
    FAILED = "FAILED",
    PENDING = "PENDING"
}

export class PaymentRequest {
    readonly orderId: OrderId;
    readonly amount: Money;
    readonly paymentMethod: string | null;

    constructor(orderId: OrderId, amount: Money, paymentMethod: string | null = null) {
        this.orderId = orderId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    static builder(): PaymentRequestBuilder {
        return new PaymentRequestBuilder();
    }
}

export class PaymentRequestBuilder {
    private _orderId!: OrderId;
    private _amount!: Money;
    private _paymentMethod: string | null = null;

    orderId(orderId: OrderId): this { this._orderId = orderId; return this; }
    amount(amount: Money): this { this._amount = amount; return this; }
    paymentMethod(paymentMethod: string): this { this._paymentMethod = paymentMethod; return this; }

    build(): PaymentRequest {
        return new PaymentRequest(this._orderId, this._amount, this._paymentMethod);
    }
}

export class PaymentResult {
    readonly status: PaymentStatus;
    readonly transactionId: string | null;
    readonly failureReason: string | null;

    constructor(status: PaymentStatus, transactionId: string | null, failureReason: string | null) {
        this.status = status;
        this.transactionId = transactionId;
        this.failureReason = failureReason;
    }

    static success(transactionId: string): PaymentResult {
        return new PaymentResult(PaymentStatus.CAPTURED, transactionId, null);
    }

    static failure(reason: string): PaymentResult {
        return new PaymentResult(PaymentStatus.FAILED, null, reason);
    }
}

export interface PaymentService {
    authorizeAndCapture(request: PaymentRequest): PaymentResult;
    refund(orderId: OrderId, amount: Money, reason: string): void;
    partialRefund(orderId: OrderId, amount: Money): void;
    additionalCharge(orderId: OrderId, amount: Money): void;
}

export class FixablePaymentService implements PaymentService {
    private paymentResult: PaymentResult = PaymentResult.success("txn-" + randomUUID());
    private readonly _authorizeRequests: PaymentRequest[] = [];
    private readonly _refundedOrders: OrderId[] = [];

    willReturnOnPayment(result: PaymentResult): void {
        this.paymentResult = result;
    }

    willFailOnPayment(reason: string): void {
        this.paymentResult = PaymentResult.failure(reason);
    }

    reset(): void {
        this.paymentResult = PaymentResult.success("txn-" + randomUUID());
        this._authorizeRequests.length = 0;
        this._refundedOrders.length = 0;
    }

    authorizeRequests(): PaymentRequest[] {
        return [...this._authorizeRequests];
    }

    refundedOrders(): OrderId[] {
        return [...this._refundedOrders];
    }

    authorizeAndCapture(request: PaymentRequest): PaymentResult {
        this._authorizeRequests.push(request);
        return this.paymentResult;
    }

    refund(orderId: OrderId, _amount: Money, _reason: string): void {
        this._refundedOrders.push(orderId);
    }

    partialRefund(_orderId: OrderId, _amount: Money): void {}
    additionalCharge(_orderId: OrderId, _amount: Money): void {}
}
