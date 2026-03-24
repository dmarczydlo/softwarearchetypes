import { describe, it, expect } from 'vitest';
import { OrderStatus, canAddLines, canModifyLines, canCancel, requiresApprovalToModify } from './order-status.js';

describe('OrderStatus', () => {
    it('only DRAFT can add lines', () => {
        expect(canAddLines(OrderStatus.DRAFT)).toBe(true);

        expect(canAddLines(OrderStatus.CONFIRMED)).toBe(false);
        expect(canAddLines(OrderStatus.PROCESSING)).toBe(false);
        expect(canAddLines(OrderStatus.FULFILLED)).toBe(false);
        expect(canAddLines(OrderStatus.CANCELLED)).toBe(false);
        expect(canAddLines(OrderStatus.CLOSED)).toBe(false);
    });

    it('DRAFT and CONFIRMED can modify lines', () => {
        expect(canModifyLines(OrderStatus.DRAFT)).toBe(true);
        expect(canModifyLines(OrderStatus.CONFIRMED)).toBe(true);

        expect(canModifyLines(OrderStatus.PROCESSING)).toBe(false);
        expect(canModifyLines(OrderStatus.FULFILLED)).toBe(false);
        expect(canModifyLines(OrderStatus.CANCELLED)).toBe(false);
        expect(canModifyLines(OrderStatus.CLOSED)).toBe(false);
    });

    it('all except CLOSED and CANCELLED can cancel', () => {
        expect(canCancel(OrderStatus.DRAFT)).toBe(true);
        expect(canCancel(OrderStatus.CONFIRMED)).toBe(true);
        expect(canCancel(OrderStatus.PENDING_ALLOCATION)).toBe(true);
        expect(canCancel(OrderStatus.PROCESSING)).toBe(true);
        expect(canCancel(OrderStatus.FULFILLED)).toBe(true);

        expect(canCancel(OrderStatus.CANCELLED)).toBe(false);
        expect(canCancel(OrderStatus.CLOSED)).toBe(false);
    });

    it('CONFIRMED and PROCESSING require approval to modify', () => {
        expect(requiresApprovalToModify(OrderStatus.CONFIRMED)).toBe(true);
        expect(requiresApprovalToModify(OrderStatus.PENDING_ALLOCATION)).toBe(true);
        expect(requiresApprovalToModify(OrderStatus.PROCESSING)).toBe(true);

        expect(requiresApprovalToModify(OrderStatus.DRAFT)).toBe(false);
        expect(requiresApprovalToModify(OrderStatus.FULFILLED)).toBe(false);
        expect(requiresApprovalToModify(OrderStatus.CANCELLED)).toBe(false);
        expect(requiresApprovalToModify(OrderStatus.CLOSED)).toBe(false);
    });
});
