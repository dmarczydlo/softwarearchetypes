export class DependencyType {
    readonly name: string;
    readonly features: ReadonlyMap<string, unknown>;

    constructor(name: string, features: Map<string, unknown> = new Map()) {
        if (!name || name.trim() === '') {
            throw new Error('Dependency type name cannot be null or blank');
        }
        this.name = name;
        this.features = new Map(features);
    }

    static finishToStart(description: string): DependencyType {
        return new DependencyType('FINISH_TO_START', new Map([['description', description]]));
    }

    static requiredResource(resourceName: string): DependencyType {
        return new DependencyType('REQUIRED_RESOURCE', new Map([['resource', resourceName]]));
    }

    static dataFlow(dataType: string): DependencyType {
        return new DependencyType('DATA_FLOW', new Map([['dataType', dataType]]));
    }

    static custom(name: string, features: Map<string, unknown>): DependencyType {
        return new DependencyType(name, features);
    }
}
