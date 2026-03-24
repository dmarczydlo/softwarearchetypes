import { Product } from "./product";
import { InstanceId } from "./instance-id";
import { SerialNumber } from "./serial-number";
import { BatchId } from "./batch";

export interface Instance {
    id(): InstanceId;
    product(): Product;
    serialNumber(): SerialNumber | null;
    batchId(): BatchId | null;
}
