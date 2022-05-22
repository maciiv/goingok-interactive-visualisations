interface IReflectionAuthorEntryRaw {
    timestamp: string;
    pseudonym: string;
    point: string;
    text: string;
    transformData(): IReflectionAuthorEntry;
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
interface ITags {
    start_index: number;
    tag: string;
    end_index: number;
}
interface IWords {
    start_index: number;
    word: string;
    type: string;
}
interface IReflectionAnalytics extends IReflectionAuthorEntry {
    tags: ITags[];
    words: IWords[];
}
export declare function buildControlAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]): Promise<void>;
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]): Promise<void>;
export declare function buildControlAuthorAnalyticsCharts(entriesRaw: IReflectionAnalytics[]): Promise<void>;
export {};
