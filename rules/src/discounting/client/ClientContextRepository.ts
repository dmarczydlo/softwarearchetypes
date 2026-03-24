import { ClientContext } from "./ClientContext";

export interface ClientContextRepository {
    loadClientContext(clientId: string): ClientContext;
}
