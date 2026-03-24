export enum OrderStatus {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    PENDING_ALLOCATION = "PENDING_ALLOCATION",
    PROCESSING = "PROCESSING",
    FULFILLED = "FULFILLED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}

export function canAddLines(status: OrderStatus): boolean {
    return status === OrderStatus.DRAFT;
}

export function canModifyLines(status: OrderStatus): boolean {
    return status === OrderStatus.DRAFT || status === OrderStatus.CONFIRMED;
}

export function canCancel(status: OrderStatus): boolean {
    return status !== OrderStatus.CLOSED && status !== OrderStatus.CANCELLED;
}

export function requiresApprovalToModify(status: OrderStatus): boolean {
    return status === OrderStatus.CONFIRMED
        || status === OrderStatus.PENDING_ALLOCATION
        || status === OrderStatus.PROCESSING;
}
