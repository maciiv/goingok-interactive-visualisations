interface IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
}
interface IReflectionAuthorEntry {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}
export declare function buildControlAdminAnalyticsCharts(entries: IAnalyticsChartsData[]): void;
export declare function buildExperimentAdminAnalyticsCharts(entries: IAnalyticsChartsData[]): void;
export {};
