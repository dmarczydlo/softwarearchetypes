export enum StepBoundary {
    EXCLUSIVE = "EXCLUSIVE",
    INCLUSIVE = "INCLUSIVE",
}

export function describeStepBoundary(boundary: StepBoundary): string {
    switch (boundary) {
        case StepBoundary.EXCLUSIVE:
            return "Exclusive upper boundary: [0, N), [N, 2N), ...";
        case StepBoundary.INCLUSIVE:
            return "Inclusive upper boundary: [0, N], [N+1, 2N+1], ...";
    }
}
