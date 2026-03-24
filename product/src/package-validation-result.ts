export class PackageValidationResult {
    private readonly _valid: boolean;
    private readonly _errors: string[];

    constructor(valid: boolean, errors: string[]) {
        this._valid = valid;
        this._errors = [...errors];
    }

    static success(): PackageValidationResult {
        return new PackageValidationResult(true, []);
    }

    static failure(errorOrErrors: string | string[]): PackageValidationResult {
        const errors = typeof errorOrErrors === "string" ? [errorOrErrors] : errorOrErrors;
        return new PackageValidationResult(false, errors);
    }

    isValid(): boolean {
        return this._valid;
    }

    errors(): string[] {
        return this._errors;
    }
}
