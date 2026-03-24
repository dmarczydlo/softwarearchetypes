import { Validity } from "./Validity.js";

export interface ComponentVersion {
    validity(): Validity;
    definedAt(): Date;
}

export enum VersionUpdateStrategy {
    REJECT_IDENTICAL = "REJECT_IDENTICAL",
    REJECT_OVERLAPPING = "REJECT_OVERLAPPING",
    ALLOW_ALL = "ALLOW_ALL",
}

export function validateVersionUpdate(
    strategy: VersionUpdateStrategy,
    existingVersions: ComponentVersion[],
    newValidity: Validity
): void {
    switch (strategy) {
        case VersionUpdateStrategy.REJECT_IDENTICAL:
            for (const version of existingVersions) {
                if (version.validity().equals(newValidity)) {
                    throw new Error(
                        `Version with identical validity period already exists: ${newValidity.validFrom.toISOString()} - ${newValidity.validTo.toISOString()}. Use different validFrom/validTo to create temporal overlaps.`
                    );
                }
            }
            break;

        case VersionUpdateStrategy.REJECT_OVERLAPPING:
            for (const version of existingVersions) {
                if (version.validity().overlaps(newValidity)) {
                    throw new Error(
                        `New validity period overlaps with existing period. Use REJECT_IDENTICAL strategy if overlaps are intentional.`
                    );
                }
            }
            break;

        case VersionUpdateStrategy.ALLOW_ALL:
            // No validation
            break;
    }
}
