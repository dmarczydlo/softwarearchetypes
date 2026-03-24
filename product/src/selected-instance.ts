import { Preconditions } from "@softwarearchetypes/common";
import { Instance } from "./instance";
import { Product } from "./product";
import { ProductIdentifier } from "./product-identifier";
import { InstanceId } from "./instance-id";
import { SelectedProduct } from "./selected-product";

export class SelectedInstance {
    readonly instance: Instance;
    readonly quantity: number;

    constructor(instance: Instance, quantity: number) {
        Preconditions.checkArgument(instance != null, "Instance must be defined");
        Preconditions.checkArgument(quantity > 0, "Quantity must be > 0");
        this.instance = instance;
        this.quantity = quantity;
    }

    product(): Product {
        return this.instance.product();
    }

    productId(): ProductIdentifier {
        return this.instance.product().id();
    }

    instanceId(): InstanceId {
        return this.instance.id();
    }

    toSelectedProduct(): SelectedProduct {
        return new SelectedProduct(this.instance.product().id(), this.quantity);
    }
}
