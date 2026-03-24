/**
 * Marker interface for conditions that trigger schedule modifications.
 * Different interpretations of when to modify the production schedule.
 */
export interface ScheduleModificationCondition {
    readonly _type: string;
}
