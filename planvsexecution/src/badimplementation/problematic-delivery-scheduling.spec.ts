import { describe, it, expect } from "vitest";
import {
    Customer,
    CustomerRepository,
    Warehouse,
    WarehouseRepository,
    WorkingCalendar,
    DriverAvailability,
    DriverAvailabilityRepository,
    DeliveryPlanService,
    DeliveryScheduleEntity,
    DeltaType,
} from "./deliveryscheduling/index";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function localDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day);
}

describe("ProblematicDeliverySchedulingTest", () => {

    // ============================================
    // PROBLEM 1: Plan without source of truth
    // ============================================

    it("problem1: plan changes when customer SLA changes", () => {
        const customerRepo = new CustomerRepository();
        const warehouseRepo = new WarehouseRepository();
        const calendar = new WorkingCalendar();
        const driverRepo = new DriverAvailabilityRepository();

        const customer = new Customer(1, "ACME Corp", 3, "North");
        customerRepo.save(customer);

        const warehouse = new Warehouse(1, "North", 100, 0);
        warehouseRepo.save(warehouse);

        const orderDate = localDate(2024, 1, 15);
        driverRepo.save(new DriverAvailability(1, "John", new Date(orderDate.getTime() + 3 * MS_PER_DAY), true, 10));
        driverRepo.save(new DriverAvailability(2, "Mike", new Date(orderDate.getTime() + 7 * MS_PER_DAY), true, 10));

        const planService = new DeliveryPlanService(customerRepo, warehouseRepo, calendar, driverRepo);

        const initialPlan = planService.calculateDeliveryPlan(100, 1, orderDate);
        expect(initialPlan.getTime()).toBe(localDate(2024, 1, 18).getTime());

        // someone changes customer SLA
        customer.slaDeliveryDays = 5;

        const newPlan = planService.calculateDeliveryPlan(100, 1, orderDate);

        expect(newPlan.getTime()).not.toBe(initialPlan.getTime());
    });

    it("problem1: cannot reconstruct historical plan", () => {
        const customerRepo = new CustomerRepository();
        const warehouseRepo = new WarehouseRepository();
        const calendar = new WorkingCalendar();
        const driverRepo = new DriverAvailabilityRepository();

        const customer = new Customer(1, "ACME Corp", 3, "North");
        customerRepo.save(customer);

        const warehouse = new Warehouse(1, "North", 100, 0);
        warehouseRepo.save(warehouse);

        const planService = new DeliveryPlanService(customerRepo, warehouseRepo, calendar, driverRepo);

        const orderDate = localDate(2024, 1, 15);
        const asOfDate = localDate(2024, 1, 1);

        expect(() => {
            planService.recalculateHistoricalPlan(100, 1, orderDate, asOfDate);
        }).toThrow("Cannot reconstruct historical plan");
    });

    // ============================================
    // PROBLEM 2: Plan and execution in one entity + mutability
    // ============================================

    it("problem2: cannot compare execution with different plans", () => {
        const schedule = new DeliveryScheduleEntity(
            1,
            100,
            localDate(2024, 1, 20),
            100
        );

        schedule.updateActualDelivery(localDate(2024, 1, 22), 95);

        const delta1 = schedule.calculateDelta();
        expect(delta1.dateDifferenceInDays).toBe(2);

        schedule.updatePlan(localDate(2024, 1, 25), 100, "manager");

        const delta2 = schedule.calculateDelta();
        expect(delta2.dateDifferenceInDays).toBe(-3);
    });

    it("problem2: simulation creates messy copies", () => {
        const schedule = new DeliveryScheduleEntity(
            1,
            100,
            localDate(2024, 1, 20),
            100
        );

        schedule.updateActualDelivery(localDate(2024, 1, 22), 95);

        const simulatedDelta = schedule.simulateIfDeliveredOn(
            localDate(2024, 1, 20),
            100
        );

        expect(simulatedDelta.type).toBe(DeltaType.PERFECT_MATCH);
    });

    it("problem2: updating plan loses intention", () => {
        const schedule = new DeliveryScheduleEntity(
            1,
            100,
            localDate(2024, 1, 20),
            100
        );

        schedule.updatePlan(localDate(2024, 1, 25), 120, "jane");

        expect(schedule.lastModifiedBy).toBe("jane");
    });

    it("problem2: mutability kills what-if questions", () => {
        const schedule = new DeliveryScheduleEntity(
            1,
            100,
            localDate(2024, 1, 20),
            100
        );

        const scenario1 = localDate(2024, 1, 18);
        const scenario2 = localDate(2024, 1, 20);
        const scenario3 = localDate(2024, 1, 25);

        const _delta1 = schedule.simulateIfDeliveredOn(scenario1, 100);
        const _delta2 = schedule.simulateIfDeliveredOn(scenario2, 100);
        const _delta3 = schedule.simulateIfDeliveredOn(scenario3, 100);

        // Simulations complete but are inherently problematic
        // (creates copies internally, risk of mutation, etc.)
    });
});
