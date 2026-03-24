export class WorkingCalendar {
    private readonly holidays: Set<number> = new Set(); // storing as getTime() for easy comparison
    private readonly nonWorkingDaysOfWeek: Set<number> = new Set([6, 0]); // 6=Saturday, 0=Sunday in JS

    addHoliday(date: Date): void {
        this.holidays.add(date.getTime());
    }

    isWorkingDay(date: Date): boolean {
        return !this.holidays.has(date.getTime())
            && !this.nonWorkingDaysOfWeek.has(date.getDay());
    }

    addWorkingDays(start: Date, workingDays: number): Date {
        let result = new Date(start.getTime());
        let added = 0;
        while (added < workingDays) {
            result = new Date(result.getTime() + 24 * 60 * 60 * 1000);
            if (this.isWorkingDay(result)) {
                added++;
            }
        }
        return result;
    }
}
