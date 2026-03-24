import { ReservationChangeRequest } from './ReservationChangeRequest.js';

export enum BatchReservationStatus {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
}

export class BatchReservationResult {
    readonly status: BatchReservationStatus;
    readonly executedRequests: ReservationChangeRequest[];

    private constructor(status: BatchReservationStatus, executedRequests: ReservationChangeRequest[]) {
        this.status = status;
        this.executedRequests = [...executedRequests];
    }

    static success(executed: Set<ReservationChangeRequest>): BatchReservationResult {
        return new BatchReservationResult(BatchReservationStatus.SUCCESS, [...executed]);
    }

    static none(): BatchReservationResult {
        return new BatchReservationResult(BatchReservationStatus.FAILURE, []);
    }
}
