import { CustomerRepository } from "./customer-repository";
import { WarehouseRepository } from "./warehouse-repository";
import { WorkingCalendar } from "./working-calendar";
import { DriverAvailabilityRepository } from "./driver-availability-repository";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class DeliveryPlanService {

    private readonly customerRepository: CustomerRepository;
    private readonly warehouseRepository: WarehouseRepository;
    private readonly workingCalendar: WorkingCalendar;
    private readonly driverRepository: DriverAvailabilityRepository;

    constructor(
        customerRepository: CustomerRepository,
        warehouseRepository: WarehouseRepository,
        workingCalendar: WorkingCalendar,
        driverRepository: DriverAvailabilityRepository
    ) {
        this.customerRepository = customerRepository;
        this.warehouseRepository = warehouseRepository;
        this.workingCalendar = workingCalendar;
        this.driverRepository = driverRepository;
    }

    calculateDeliveryPlan(_orderId: number, customerId: number, orderDate: Date): Date {
        const customer = this.customerRepository.findById(customerId);
        if (!customer) {
            throw new Error(`Customer not found: ${customerId}`);
        }
        const slaDeliveryDays = customer.slaDeliveryDays;

        const warehouse = this.warehouseRepository.findByRegion(customer.region);
        if (!warehouse) {
            throw new Error(`Warehouse not found for region: ${customer.region}`);
        }

        let tentativeDate = this.workingCalendar.addWorkingDays(orderDate, slaDeliveryDays);

        let drivers = this.driverRepository.findAvailableDriversOn(tentativeDate);

        while (!warehouse.hasCapacityFor(1) || drivers.length === 0) {
            tentativeDate = new Date(tentativeDate.getTime() + MS_PER_DAY);
            if (!this.workingCalendar.isWorkingDay(tentativeDate)) {
                continue;
            }
            drivers = this.driverRepository.findAvailableDriversOn(tentativeDate);
        }

        return tentativeDate;
    }

    recalculateHistoricalPlan(
        _orderId: number, _customerId: number, _orderDate: Date, _asOf: Date
    ): Date {
        throw new Error("Cannot reconstruct historical plan - no versioning of source entities!");
    }
}
