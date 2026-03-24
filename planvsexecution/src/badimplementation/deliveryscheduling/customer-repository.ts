import { Customer } from "./customer";

export class CustomerRepository {
    private readonly storage: Map<number, Customer> = new Map();

    save(customer: Customer): void {
        this.storage.set(customer.id, customer);
    }

    findById(id: number): Customer | null {
        return this.storage.get(id) ?? null;
    }
}
