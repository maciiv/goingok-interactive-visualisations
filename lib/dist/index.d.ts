interface IReflectionAuthorEntry {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}
interface IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    selected: boolean;
}
export declare function buildControlAdminAnalyticsCharts(entries: IAnalyticsChartsData[]): void;
export declare function buildExperimentAdminAnalyticsCharts(entries: IAnalyticsChartsData[]): void;
export {};
