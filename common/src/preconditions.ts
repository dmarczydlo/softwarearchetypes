export class IllegalArgumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IllegalArgumentError';
    }
}

export class IllegalStateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IllegalStateError';
    }
}

export abstract class Preconditions {

    public static checkArgument(expression: boolean, errorMessage: string): void {
        if (!expression) {
            throw new IllegalArgumentError(errorMessage);
        }
    }

    public static checkState(state: boolean, errorMessage: string): void {
        if (!state) {
            throw new IllegalStateError(errorMessage);
        }
    }

    public static checkNotNull(value: unknown, errorMessage: string): void {
        Preconditions.checkArgument(value != null, errorMessage);
    }
}
