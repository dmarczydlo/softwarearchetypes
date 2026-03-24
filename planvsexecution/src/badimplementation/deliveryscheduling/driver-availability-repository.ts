import { DriverAvailability } from "./driver-availability";

export class DriverAvailabilityRepository {
    private readonly storage: DriverAvailability[] = [];

    save(availability: DriverAvailability): void {
        this.storage.push(availability);
    }

    findAvailableDriversOn(date: Date): DriverAvailability[] {
        return this.storage.filter(d =>
            d.date.getTime() === date.getTime() && d.available
        );
    }
}
