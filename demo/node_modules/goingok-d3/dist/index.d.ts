interface IReflectionAuthorEntryRaw {
    timestamp: string;
    pseudonym: string;
    point: string;
    text: string;
}
interface IAnalyticsChartsDataRaw {
    group: string;
    value: IReflectionAuthorEntryRaw[];
    transformData(data: IAnalyticsChartsDataRaw): AnalyticsChartsData;
}
interface IReflectionAuthorEntry {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}
interface IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    colour: string;
    selected: boolean;
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData;
}
declare class AnalyticsChartsData implements IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    colour: string;
    selected: boolean;
    constructor(group: string, value: IReflectionAuthorEntry[], colour?: string, selected?: boolean);
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData;
}
export declare function buildControlAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]): void;
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]): void;
export {};
