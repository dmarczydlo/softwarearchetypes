import { ScheduleAnalysisFacade } from "./schedule-analysis-facade";

export class ScheduleAnalysisConfiguration {
    static facade(): ScheduleAnalysisFacade {
        return new ScheduleAnalysisFacade();
    }
}
