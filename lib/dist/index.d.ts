interface IReflectionAuthorEntryRaw {
    timestamp: string;
    pseudonym: string;
    point: string;
    text: string;
}
interface IAnalyticsChartsDataRaw {
    group: string;
    value: IReflectionAuthorEntryRaw[];
    createDate: string;
    transformData(): AnalyticsChartsData;
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
    creteDate: Date;
    colour: string;
    selected: boolean;
    getUsersData(): AnalyticsChartsData;
}
declare class AnalyticsChartsData implements IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    constructor(group: string, value: IReflectionAuthorEntry[], createDate?: Date, colour?: string, selected?: boolean);
    getUsersData(): AnalyticsChartsData;
}
export declare function buildControlAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]): Promise<void>;
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]): Promise<void>;
export {};
