export enum ServiceDeliveryStatus {
    SCHEDULED = "SCHEDULED",
    EXECUTING = "EXECUTING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export abstract class ServiceDeliveryStatusOps {
    static isFinished(status: ServiceDeliveryStatus): boolean {
        return status === ServiceDeliveryStatus.COMPLETED || status === ServiceDeliveryStatus.CANCELLED;
    }

    static isInProgress(status: ServiceDeliveryStatus): boolean {
        return status === ServiceDeliveryStatus.EXECUTING;
    }

    static canStart(status: ServiceDeliveryStatus): boolean {
        return status === ServiceDeliveryStatus.SCHEDULED;
    }

    static canCancel(status: ServiceDeliveryStatus): boolean {
        return status === ServiceDeliveryStatus.SCHEDULED || status === ServiceDeliveryStatus.EXECUTING;
    }
}
