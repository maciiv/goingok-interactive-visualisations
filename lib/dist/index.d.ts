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
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData;
}
declare class AnalyticsChartsData implements IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    selected: boolean;
    constructor(group: string, value: IReflectionAuthorEntry[], selected?: boolean);
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData;
}
export declare function buildControlAdminAnalyticsCharts(entries: IAnalyticsChartsData[]): void;
export declare function buildExperimentAdminAnalyticsCharts(entries: IAnalyticsChartsData[]): void;
export {};
