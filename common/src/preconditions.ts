export abstract class Preconditions {

    public static checkArgument(expression: boolean, errorMessage: string): void {
        if (!expression) {
            throw new Error(errorMessage);
        }
    }

    public static checkState(state: boolean, errorMessage: string): void {
        if (!state) {
            throw new Error(errorMessage);
        }
    }

    public static checkNotNull(value: unknown, errorMessage: string): void {
        Preconditions.checkArgument(value != null, errorMessage);
    }
}
