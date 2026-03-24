export enum AccountType {
    ASSET = "ASSET",
    OFF_BALANCE = "OFF_BALANCE",
    EXPENSE = "EXPENSE",
    LIABILITY = "LIABILITY",
    REVENUE = "REVENUE"
}

const doubleEntryBookingEnabled: Record<AccountType, boolean> = {
    [AccountType.ASSET]: true,
    [AccountType.OFF_BALANCE]: false,
    [AccountType.EXPENSE]: true,
    [AccountType.LIABILITY]: true,
    [AccountType.REVENUE]: true
};

export function isDoubleEntryBookingEnabled(type: AccountType): boolean {
    return doubleEntryBookingEnabled[type];
}
