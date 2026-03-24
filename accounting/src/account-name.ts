import { Preconditions, StringUtils } from '@softwarearchetypes/common';

export class AccountName {
    readonly value: string;

    static readonly DEFAULT_DELIMITER = ":";

    constructor(value: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(value), "Account name cannot be empty");
        this.value = value;
    }

    static of(value: string): AccountName {
        return new AccountName(value);
    }

    static compositeFrom(...components: string[]): AccountName {
        return AccountName.compositeFromWithDelimiter(AccountName.DEFAULT_DELIMITER, ...components);
    }

    static compositeFromWithDelimiter(delimiter: string, ...components: string[]): AccountName {
        Preconditions.checkArgument(components != null && components.length > 0, "Account name cannot be built from an empty array");
        components.forEach(val => Preconditions.checkArgument(StringUtils.isNotBlank(val), "Account name component cannot be empty"));
        return new AccountName(components.join(delimiter));
    }
}
