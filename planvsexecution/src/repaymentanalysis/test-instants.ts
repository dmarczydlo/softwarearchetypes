export function instantUTC(year: number, month: number, day: number, hour: number, minute: number): Date {
    return new Date(Date.UTC(year, month - 1, day, hour, minute));
}
