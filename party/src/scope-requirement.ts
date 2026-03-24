import { Preconditions, StringUtils } from '@softwarearchetypes/common';
import type { OperatingScope } from './operating-scope.js';

export class ScopeRequirement {
    readonly scopeType: string;
    readonly requiredScope: OperatingScope;
    constructor(scopeType: string, requiredScope: OperatingScope) {
        Preconditions.checkArgument(StringUtils.isNotBlank(scopeType), 'Scope type cannot be blank');
        Preconditions.checkArgument(requiredScope != null, 'Required scope cannot be null');
        this.scopeType = scopeType;
        this.requiredScope = requiredScope;
    }
}
